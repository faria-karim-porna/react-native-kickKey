package com.kickkey

import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DeviceEventManagerModule

class KickKeyInputMethodService : InputMethodService() {

    companion object {
        private const val TAG = "KickKeyIME"
        // Standard keyboard height in pixels (~280dp at 2.75 density)
        private const val KEYBOARD_HEIGHT_PX = 770
        // First watchdog check after this delay, then re-check periodically. The
        // FIRST cold start after install is slow (RN init + 911KB Hermes bundle +
        // Fabric setup can exceed 8s on slow hardware), so we retry a few times
        // before declaring failure instead of erroring at the first check.
        private const val STARTUP_WATCHDOG_MS = 8000L
        private const val WATCHDOG_RETRY_MS = 3000L
        private const val MAX_WATCHDOG_ATTEMPTS = 4

        // Total wall-clock time before the watchdog gives up: 8s + 3×3s = 17s.
        // Used in error messages so they match the real timeout.
        private val TOTAL_WATCHDOG_MS: Long =
            STARTUP_WATCHDOG_MS + WATCHDOG_RETRY_MS * (MAX_WATCHDOG_ATTEMPTS - 1)
    }

    private var reactSurface: ReactSurface? = null
    private var keyboardContainer: FrameLayout? = null
    private var surfaceStartTask: TaskInterface<Void>? = null
    private var watchdog: Runnable? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        KickKeyModule.hapticManager     = HapticManager(this)
        KickKeyModule.banglaEngine      = BanglaInputEngine()
        KickKeyModule.suggestionEngine  = SuggestionEngine(this)
        KickKeyModule.clipboardHandler  = ClipboardHandler(this)
        Log.i(TAG, "IME created — all handlers ready")

        try {
            val am = getSystemService(AUDIO_SERVICE) as android.media.AudioManager
            am.loadSoundEffects()
        } catch (e: Exception) {
            Log.w(TAG, "Sound pool preload failed: ${e.message}")
        }
    }

    override fun onCreateInputView(): View {
        Log.i(TAG, "onCreateInputView")

        // Dispose previous surface if any
        disposeSurface()

        // Reset the JS mount signal for this open cycle
        KickKeyModule.keyboardJsReady = false

        // Fail fast with a VISIBLE error instead of a silent blank keyboard if
        // the keyboard JS bundle is missing or corrupt in the APK. Previously a
        // missing assets://keyboard.bundle produced an empty transparent area
        // with no explanation.
        val bundleProblem = verifyKeyboardBundle()
        if (bundleProblem != null) {
            Log.e(TAG, "keyboard.bundle problem: $bundleProblem")
            return createFallbackView(bundleProblem)
        }

        try {
            val app = application as? KickKeyApplication ?: run {
                Log.e(TAG, "KickKeyApplication not found"); return createFallbackView("KickKeyApplication not found")
            }
            Log.i(TAG, "Accessing keyboardReactHost...")
            val host = app.keyboardReactHost
            Log.i(TAG, "Creating React surface...")
            val surface = host.createSurface(this, "KickKeyKeyboard", null)
            Log.i(TAG, "Starting React surface...")
            surfaceStartTask = surface.start()
            reactSurface = surface

            val surfaceView = surface.view
            if (surfaceView != null) {
                Log.i(TAG, "Keyboard surface view created — wrapping in FrameLayout")

                // ── FIX: give the React surface EXPLICIT dimensions ──────────────
                // ReactSurfaceView.onMeasure() only uses the measured spec size when
                // the mode is EXACTLY. With AT_MOST/UNSPECIFIED specs (which is what
                // the IME window passes to a WRAP_CONTENT input view), it sizes itself
                // from its children — which are empty until React mounts — so it
                // measured 0x0. Fabric then laid the whole keyboard out at 0x0:
                // the window took up the expected height but every key was invisible.
                //
                // By giving the container AND the surface view a FIXED height, the
                // surface view always receives EXACT measure specs and renders at the
                // full keyboard size.
                val container = FrameLayout(this).apply {
                    layoutParams = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        KEYBOARD_HEIGHT_PX
                    )
                    // Dark background — matches the default keyboard theme and avoids
                    // a transparent flash while React loads.
                    setBackgroundColor(0xFF0D0D1A.toInt())
                }
                container.addView(surfaceView, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    KEYBOARD_HEIGHT_PX
                ))
                keyboardContainer = container

                // Watchdog: if the surface hasn't started rendering after a timeout,
                // show a VISIBLE error instead of a silent blank keyboard.
                scheduleStartupWatchdog(app)

                Log.i(TAG, "Keyboard view created (surface.isRunning=${safeIsRunning(surface)})")
                return container
            } else {
                Log.e(TAG, "surface.view is null — returning fallback")
                return createFallbackView("surface.view is null")
            }
        } catch (e: Throwable) {
            Log.e(TAG, "onCreateInputView FAILED", e)
            return createFallbackView("Exception: ${e.message}")
        }
    }

    /**
     * After the keyboard view has been shown, verify the keyboard is actually
     * rendering. If it is not (bundle failed to load, host crashed, surface failed
     * to start), replace the container's content with a visible error message.
     *
     * The AUTHORITATIVE success signal is [KickKeyModule.keyboardJsReady]: the
     * keyboard JS only calls keyboardReady() after its React root mounted and
     * committed a frame. That can only happen when the ReactInstance was created,
     * the bundle executed and the surface was started — i.e. the keyboard IS on
     * screen. ReactSurface.isRunning is NOT trusted on its own: it can transiently
     * report false even while JS is rendering (e.g. after a surface stop/recreate
     * in the same session, or when the native getter throws mid-check), which
     * previously caused the watchdog to tear down a WORKING keyboard and replace
     * it with this error view.
     *
     * Checks run a few times (cold start is slow) and give up only if neither the
     * surface is running nor the JS mounted nor a fault can be surfaced.
     */
    private fun scheduleStartupWatchdog(app: KickKeyApplication) {
        cancelWatchdog()
        val r = object : Runnable {
            var attempts = 0

            override fun run() {
                attempts++
                val surface = reactSurface ?: return
                try {
                    // ── SUCCESS ──
                    // The keyboard JS mounted & rendered. jsReady is only set after
                    // the React root committed a frame, which requires a started
                    // surface — so a working keyboard must not be replaced by an
                    // error view just because ReactSurface.isRunning transiently
                    // reads false (the reported bug).
                    //
                    // Still require the surface/view to be alive so a genuine
                    // post-mount crash (JS mounted, then host died) is not masked:
                    // the view will have been detached/stopped in that case.
                    if (KickKeyModule.keyboardJsReady && surfaceIsAlive(surface)) {
                        Log.i(TAG, "Watchdog: keyboard JS mounted & rendering — keyboard OK")
                        return
                    }

                    if (safeIsRunning(surface)) {
                        // Surface running but JS hasn't signalled mount yet.
                        if (attempts >= MAX_WATCHDOG_ATTEMPTS) {
                            showErrorFallback(
                                "Keyboard JS did not mount",
                                "surface.isRunning=true jsReady=false after ~${TOTAL_WATCHDOG_MS / 1000}s " +
                                    "— check logcat: adb logcat | grep -E 'KickKey|ReactHost|ReactNative'"
                            )
                        } else {
                            Log.w(TAG, "Watchdog: surface running but JS mount signal not received yet (attempt $attempts)")
                            mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                        }
                        return
                    }

                    val hostFault = app.keyboardStartTask?.takeIf { it.isFaulted() }?.getError()
                    if (hostFault != null) {
                        Log.e(TAG, "Keyboard ReactHost failed to start", hostFault)
                        showErrorFallback("Keyboard ReactHost failed to start", hostFault.message)
                        return
                    }

                    val surfaceFault = surfaceStartTask?.takeIf { it.isFaulted() }?.getError()
                    if (surfaceFault != null) {
                        Log.e(TAG, "Keyboard React surface failed to start", surfaceFault)
                        showErrorFallback("Keyboard React surface failed to start", surfaceFault.message)
                        return
                    }

                    // Not running and no JS signal yet — the first cold start after
                    // install (RN init + bundle load + Fabric setup) can take >8s.
                    // Retry a few times before declaring failure.
                    if (attempts >= MAX_WATCHDOG_ATTEMPTS) {
                        showErrorFallback(
                            "Keyboard did not start within ${TOTAL_WATCHDOG_MS / 1000}s",
                            "isRunning=${safeIsRunning(surface)} jsReady=${KickKeyModule.keyboardJsReady} " +
                                "— check logcat: adb logcat | grep -E 'KickKey|ReactHost|ReactNative'"
                        )
                    } else {
                        Log.w(TAG, "Watchdog: surface not running yet (attempt $attempts) — retrying")
                        mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                    }
                } catch (e: Exception) {
                    // A transient exception must not silently kill the watchdog and
                    // leave a possibly-working keyboard unmonitored — retry unless
                    // we've exhausted the attempts.
                    Log.w(TAG, "Watchdog check failed (attempt $attempts): ${e.message}")
                    if (attempts < MAX_WATCHDOG_ATTEMPTS) {
                        mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                    }
                }
            }
        }
        watchdog = r
        mainHandler.postDelayed(r, STARTUP_WATCHDOG_MS)
    }

    private fun cancelWatchdog() {
        watchdog?.let { mainHandler.removeCallbacks(it) }
        watchdog = null
    }

    private fun safeIsRunning(surface: ReactSurface?): Boolean = try {
        surface?.isRunning == true
    } catch (e: Exception) {
        false
    }

    /**
     * True when the surface reports running, or its view is still attached to the
     * window. The view-attached check covers the case where isRunning transiently
     * reads false even though the keyboard is on screen and rendering.
     */
    private fun surfaceIsAlive(surface: ReactSurface?): Boolean =
        safeIsRunning(surface) || try {
            surface?.view?.isAttachedToWindow == true
        } catch (e: Exception) {
            false
        }

    private fun showErrorFallback(reason: String, detail: String?) {
        Log.e(TAG, "showErrorFallback: $reason | $detail")
        val container = keyboardContainer ?: return
        try {
            val message = if (detail.isNullOrBlank()) reason else "$reason — $detail"
            val fallback = createFallbackView(message)
            container.removeAllViews()
            container.addView(fallback, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))
        } catch (e: Exception) {
            Log.w(TAG, "showErrorFallback failed", e)
        }
    }

    /**
     * Verifies assets://keyboard.bundle exists and looks like Hermes bytecode
     * (magic bytes \u00C6\u001F\u00BC\u0003). Returns null when OK, otherwise a
     * human-readable reason for the fallback error view.
     */
    private fun verifyKeyboardBundle(): String? {
        return try {
            assets.open("keyboard.bundle").use { input ->
                val header = ByteArray(4)
                val read = input.read(header)
                if (read < 4) "keyboard.bundle is truncated (${read} bytes read)"
                else if (!(header[0] == 0xC6.toByte() && header[1] == 0x1F.toByte() &&
                           header[2] == 0xBC.toByte() && header[3] == 0x03.toByte()))
                    "keyboard.bundle is not Hermes bytecode (magic ${header.joinToString { "%02X".format(it.toInt() and 0xFF) }})"
                else null
            }
        } catch (e: java.io.FileNotFoundException) {
            "keyboard.bundle is MISSING from APK assets — run 'node scripts/build-keyboard-bundle.js' and rebuild"
        } catch (e: Exception) {
            "keyboard.bundle unreadable: ${e.message}"
        }
    }

    private fun createFallbackView(message: String): View {
        Log.e(TAG, "FALLBACK VIEW SHOWN: $message")
        val tv = android.widget.TextView(this).apply {
            text = "KickKey Error: $message\n\nCheck logcat: adb logcat | grep KickKey"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 12f
            setPadding(24, 24, 24, 24)
            setBackgroundColor(0xFF1A1A2E.toInt()) // Dark background so text is visible
        }
        return FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                KEYBOARD_HEIGHT_PX
            )
            setBackgroundColor(0xFF1A1A2E.toInt()) // Dark background
            addView(tv, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))
        }
    }

    private fun disposeSurface() {
        cancelWatchdog()
        try {
            reactSurface?.stop()
            reactSurface = null
            keyboardContainer?.removeAllViews()
            keyboardContainer = null
            surfaceStartTask = null
            // Reset the JS mount flag whenever the surface is torn down so a stale
            // "ready" from a previous surface/session can never mask a genuinely
            // dead keyboard in the next open cycle.
            KickKeyModule.keyboardJsReady = false
        } catch (e: Exception) {
            Log.w(TAG, "disposeSurface error: ${e.message}")
        }
    }

    override fun onStartInputView(info: EditorInfo, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        KickKeyModule.activeInputConnection = currentInputConnection
        KickKeyModule.banglaEngine?.reset()
        KickKeyModule.suggestionEngine?.reset()

        val typeClass  = info.inputType and 0x0000000F
        val isPassword = (info.inputType and 0x000000D0) != 0
        val isNumber   = typeClass == 0x00000002
        val isPhone    = typeClass == 0x00000003
        val isUrl      = (info.inputType and 0x000000F0) == 0x00000020
        val isEmail    = (info.inputType and 0x000000F0) == 0x00000050

        KickKeyModule.suggestionEngine?.setEnabled(!isPassword)

        if (!isPassword && !restarting) {
            KickKeyModule.clipboardHandler?.captureCurrentClipboard()
        }

        emitInputStarted(info, isPassword, isNumber, isPhone, isUrl, isEmail)

        Log.i(TAG, "InputStarted — class=$typeClass password=$isPassword number=$isNumber phone=$isPhone url=$isUrl")
    }

    private fun emitInputStarted(
        info: EditorInfo,
        isPassword: Boolean, isNumber: Boolean, isPhone: Boolean,
        isUrl: Boolean, isEmail: Boolean,
        attempt: Int = 0,
    ) {
        try {
            val app = application as? KickKeyApplication ?: return
            val reactContext = app.keyboardReactHost.currentReactContext
            if (reactContext == null) {
                // The keyboard ReactHost starts asynchronously — if the JS context
                // isn't ready yet, the very first input-type event would be lost
                // (wrong layout for number/phone/password fields). Retry briefly.
                if (attempt < 10) {
                    Log.d(TAG, "emitInputStarted: React context not ready yet (attempt $attempt) — retrying")
                    mainHandler.postDelayed({
                        emitInputStarted(info, isPassword, isNumber, isPhone, isUrl, isEmail, attempt + 1)
                    }, 200)
                }
                return
            }
            val imeAction = when (info.imeOptions and EditorInfo.IME_MASK_ACTION) {
                EditorInfo.IME_ACTION_SEARCH -> "search"
                EditorInfo.IME_ACTION_SEND   -> "send"
                EditorInfo.IME_ACTION_DONE   -> "done"
                EditorInfo.IME_ACTION_NEXT   -> "next"
                EditorInfo.IME_ACTION_GO     -> "go"
                else                         -> "return"
            }
            val params = Arguments.createMap().apply {
                putInt("inputType", info.inputType)
                putBoolean("isPassword", isPassword)
                putBoolean("isNumber",   isNumber)
                putBoolean("isPhone",    isPhone)
                putBoolean("isUrl",      isUrl)
                putBoolean("isEmail",    isEmail)
                putString("imeAction",   imeAction)
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onInputStarted", params)
        } catch (e: Exception) {
            Log.w(TAG, "emitInputStarted failed: ${e.message}")
        }
    }

    override fun onFinishInput() {
        super.onFinishInput()
        val pending = KickKeyModule.banglaEngine?.flush() ?: ""
        if (pending.isNotEmpty()) KickKeyModule.activeInputConnection?.commitText(pending, 1)
        KickKeyModule.activeInputConnection = null
    }

    override fun onWindowHidden() {
        super.onWindowHidden()
        KickKeyModule.activeInputConnection = null
        KickKeyModule.banglaEngine?.reset()
        KickKeyModule.suggestionEngine?.reset()
    }

    override fun onDestroy() {
        disposeSurface()
        KickKeyModule.hapticManager    = null
        KickKeyModule.banglaEngine     = null
        KickKeyModule.suggestionEngine = null
        KickKeyModule.clipboardHandler = null
        super.onDestroy()
        Log.i(TAG, "IME destroyed")
    }
}
