package com.kickkey

import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewTreeObserver
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import com.facebook.react.ReactHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.common.LifecycleState
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DeviceEventManagerModule

class KickKeyInputMethodService : InputMethodService() {

    companion object {
        private const val TAG = "KickKeyIME"
        // Keyboard height in dp. Must fit the FULL JS keyboard content, which is
        // ~354dp with the default theme (header 28 + suggestion bar 40 + 4 rows ×
        // (keyHeight 48 + 8 margin) + bottom row 56 + padding 6) and grows with
        // the key-height slider (40–60dp). 400dp covers every keyHeight up to
        // ~57dp without clipping the bottom row.
        private const val KEYBOARD_HEIGHT_DP = 400
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

    /** Keyboard height in pixels, derived from dp × device density. */
    private val keyboardHeightPx: Int
        get() = (KEYBOARD_HEIGHT_DP * resources.displayMetrics.density).toInt()

    private var reactSurface: ReactSurface? = null
    private var keyboardContainer: FrameLayout? = null
    private var surfaceStartTask: TaskInterface<Void>? = null
    private var watchdog: Runnable? = null
    // Diagnostics: how many times we tried to resume the keyboard ReactHost and the last
    // error. Surfaced in the watchdog error text so a failure is self-diagnosing even
    // without logcat access.
    private var resumeAttempts = 0
    private var resumeLastError: String? = null
    // Monotonic token: bumped on every scheduleJsReadyResume() and on teardown, so a stale
    // resume-poll chain from a previous open stops as soon as a newer one (or a dispose)
    // starts. Also bumped when the watchdog gives up, so the poll can't resume a host whose
    // surface was already detached by the error view.
    private var resumeGeneration = 0L
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        KickKeyModule.hapticManager     = HapticManager(this)
        KickKeyModule.banglaEngine      = BanglaInputEngine()
        KickKeyModule.suggestionEngine  = SuggestionEngine(this)
        KickKeyModule.clipboardHandler  = ClipboardHandler(this)
        Log.i(TAG, "IME created — all handlers ready (keyboardHeightPx=${keyboardHeightPx})")

        try {
            val am = getSystemService(AUDIO_SERVICE) as android.media.AudioManager
            am.loadSoundEffects()
        } catch (e: Exception) {
            Log.w(TAG, "Sound pool preload failed: ${e.message}")
        }
    }

    override fun onCreateInputView(): View {
        Log.i(TAG, "onCreateInputView (keyboardHeightPx=${keyboardHeightPx})")

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

            // The keyboard ReactHost is resumed by scheduleJsReadyResume() below — and ONLY
            // after the JS signals it has fully mounted (keyboardJsReady). Resuming before
            // the instance existed (a previous iteration) broke JS startup in release builds
            // (see KickKeyApplication.initKeyboardRuntime for details).

            Log.i(TAG, "Creating React surface...")
            val surface = host.createSurface(this, "KickKeyKeyboard", null)
            Log.i(TAG, "Starting React surface...")
            surfaceStartTask = surface.start()
            reactSurface = surface

            val surfaceView = surface.view
            if (surfaceView != null) {
                Log.i(TAG, "Keyboard surface view created — wrapping in FrameLayout")

                // ── CRITICAL: deterministic keyboard sizing ────────────────────
                // InputMethodService.setInputView() REMOVES the view returned by
                // onCreateInputView() from our tree and re-adds it to its input
                // frame with `FrameLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)`,
                // silently discarding whatever layout params we set here.
                //
                // Under the resulting AT_MOST/UNSPECIFIED measure specs,
                // ReactSurfaceView.onMeasure() (RN 0.86,
                // ReactAndroid/.../runtime/ReactSurfaceView.kt) sizes itself from
                // its children — which are empty until React mounts — so it
                // measures 0×0. Fabric then lays the whole keyboard out at 0×0:
                // the window keeps its height but every key is invisible (the
                // reported black keyboard area).
                //
                // A previous attempt re-asserted the container's LayoutParams
                // from `post {}`, which is timing-dependent (it can be swallowed
                // or re-replaced by the framework). Instead we override the
                // container's onMeasure() to FORCE EXACT specs on every measure
                // pass — width = window width (falling back to the display
                // width), height = KEYBOARD_HEIGHT_DP in px. The container is
                // therefore always measured EXACTLY, and its children (the
                // ReactSurfaceView, MATCH_PARENT × MATCH_PARENT) always receive
                // EXACTLY specs, so ReactSurfaceView.onMeasure() uses the real
                // size and passes EXACT layout constraints to Fabric.
                val container = object : FrameLayout(this) {
                    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
                        var width = MeasureSpec.getSize(widthMeasureSpec)
                        if (width <= 0) {
                            // Defensive: an UNSPECIFIED/0 spec must not collapse
                            // the keyboard to zero width.
                            width = resources.displayMetrics.widthPixels
                        }
                        // Landscape / short screens: never force a height taller
                        // than ~90% of the display (the system clamps IME windows
                        // anyway, but a defensive cap avoids fighting it).
                        val height = minOf(
                            keyboardHeightPx,
                            (resources.displayMetrics.heightPixels * 0.9f).toInt().coerceAtLeast(1)
                        )
                        super.onMeasure(
                            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
                        )
                    }
                }.apply {
                    layoutParams = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        keyboardHeightPx
                    )
                    // Belt & suspenders: if the layout params are ever replaced by
                    // the IME framework (see above), minimumHeight survives because
                    // it is a View property, not a LayoutParams value.
                    minimumHeight = keyboardHeightPx
                    // Dark background — matches the default keyboard theme and avoids
                    // a transparent flash while React loads.
                    setBackgroundColor(0xFF0D0D1A.toInt())
                }
                container.addView(surfaceView, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ))

                // Diagnostics: log the ACTUAL rendered size of the surface as it
                // lays out (bounded to the first 3 layouts — the first pass can
                // legitimately be 0×0 before the container's forced measure takes
                // effect, so log every layout until it stabilises). A persistent
                // 0×0 here = sizing regression; full size = sizing is healthy and
                // the problem (if any) is elsewhere.
                var surfaceLayoutLogs = 0
                surfaceView.viewTreeObserver.addOnGlobalLayoutListener(
                    object : ViewTreeObserver.OnGlobalLayoutListener {
                        override fun onGlobalLayout() {
                            if (surfaceLayoutLogs >= 3) {
                                surfaceView.viewTreeObserver.removeOnGlobalLayoutListener(this)
                                return
                            }
                            surfaceLayoutLogs++
                            Log.i(
                                TAG,
                                "Surface view laid out: ${surfaceView.width}×${surfaceView.height} " +
                                    "children=${surfaceView.childCount} " +
                                    "attached=${surfaceView.isAttachedToWindow} " +
                                    "isRunning=${safeIsRunning(surface)}"
                            )
                        }
                    }
                )
                keyboardContainer = container

                // Resume the keyboard ReactHost once the JS has FULLY mounted
                // (scheduleJsReadyResume). This is the lifecycle signal that starts Fabric's
                // DispatchUIFrameCallback — which is what actually applies the JS mount items
                // to the surface view. Without it the keyboard JS mounts (jsReady=true) but no
                // views are ever attached (children=0 → black keyboard, §15).
                //
                // Resuming on startTask completion (a previous iteration) was wrong in BOTH
                // directions: an 8s poll could expire before a slow instance finished creating
                // (→ host stuck BEFORE_CREATE, black keyboard) or fire while the JS bundle was
                // still executing and kill the host (→ jsReady=false, §16/§17). jsReady only
                // becomes true after the root committed a frame, i.e. instance, bundle, surface
                // and modules are all up — the safest possible moment to resume, equivalent to
                // a normal Activity's onResume() after startup.
                scheduleJsReadyResume(app)

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
     * to start, or the surface stayed 0×0 / empty), replace the container's content
     * with a visible error message.
     *
     * Success requires ALL THREE:
     *   1. [KickKeyModule.keyboardJsReady] — the keyboard JS signalled readiness
     *      from useEffect, which only happens after its React root mounted and
     *      committed a frame.
     *   2. The surface view has a real laid-out size (>0 × >0). A 0×0 view means
     *      the measure chain collapsed (see onCreateInputView) and Fabric laid the
     *      keyboard out invisibly — ReactSurface.isRunning and isAttachedToWindow
     *      are both unreliable for detecting this, which is why jsReady alone
     *      previously left a black keyboard in place forever.
     *   3. Fabric actually mounted content into the view (childCount > 0).
     *
     * Checks run a few times (cold start is slow) and give up only if none of
     * the success conditions can be met or a fault can be surfaced.
     */
    private fun scheduleStartupWatchdog(app: KickKeyApplication) {
        cancelWatchdog()
        val r = object : Runnable {
            var attempts = 0

            override fun run() {
                attempts++
                val surface = reactSurface ?: return
                try {
                    val view = surface.view
                    val laidOutSize = view != null && view.width > 0 && view.height > 0
                    val hasContent = view != null && view.childCount > 0

                    // ── SUCCESS ──
                    // JS mounted AND the surface view is really sized AND Fabric
                    // mounted content into it → the keyboard is on screen and
                    // rendering. Do not touch the container after this point.
                    //
                    // Why the childCount gate cannot false-positive (the §13
                    // lesson): keyboardReady() fires from useEffect right after the
                    // React commit, but Fabric applies the mount transaction
                    // (adding content views as children of the surface view) on the
                    // UI thread microseconds later. By the first check here (8s) a
                    // WORKING keyboard has long since had both a real size AND ≥1
                    // child. Requiring both for the full 17s window can only mean
                    // the keyboard genuinely rendered nothing visible.
                    if (KickKeyModule.keyboardJsReady && laidOutSize && hasContent) {
                        Log.i(
                            TAG,
                            "Watchdog: keyboard JS mounted & rendering — keyboard OK " +
                                "(lifecycle=${app.keyboardReactHost.lifecycleState} " +
                                "children=${view?.childCount ?: -1})"
                        )
                        return
                    }

                    // ── JS mounted, but nothing visible ──
                    // The keyboard JS committed a frame (keyboardReady fired) yet
                    // the view is 0×0 or empty. This is the black-keyboard case.
                    // Do not leave it undiagnosable forever — surface it.
                    if (KickKeyModule.keyboardJsReady) {
                        // Belt & suspenders: if the JS mounted but the host is somehow not
                        // RESUMED yet (a resume attempt failed or was dropped), try again —
                        // resuming is idempotent and cheap.
                        val host = app.keyboardReactHost
                        if (host.lifecycleState != LifecycleState.RESUMED) {
                            resumeKeyboardHost(host)
                        }
                        if (attempts >= MAX_WATCHDOG_ATTEMPTS) {
                            showErrorFallback(
                                "Keyboard mounted but not visible",
                                "jsReady=true view=${view?.width}×${view?.height} " +
                                    "children=${view?.childCount ?: -1} after ~${TOTAL_WATCHDOG_MS / 1000}s " +
                                    "— Fabric mount dispatcher stalled (ReactHost lifecycle=" +
                                    "${host.lifecycleState} resumeAttempts=$resumeAttempts " +
                                    "resumeError=${resumeLastError ?: "none"}); " +
                                    "check logcat: adb logcat | grep -E 'KickKey|ReactHost|ReactNative'"
                            )
                        } else {
                            Log.w(
                                TAG,
                                "Watchdog: JS mounted but view not rendering yet " +
                                    "(${view?.width}×${view?.height} children=${view?.childCount ?: -1}, " +
                                    "lifecycle=${host.lifecycleState}, attempt $attempts)"
                            )
                            mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                        }
                        return
                    }

                    // ── Surface running, JS not mounted yet ──
                    if (safeIsRunning(surface)) {
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
                        // Surface as much state as possible: with no logcat access this
                        // error text is the only diagnostic the user can paste back.
                        val startState = when {
                            app.keyboardStartTask?.isFaulted() == true -> "faulted"
                            app.keyboardStartTask?.isCompleted() == true -> "completed"
                            else -> "pending"
                        }
                        val surfaceState = when {
                            surfaceStartTask?.isFaulted() == true -> "faulted"
                            surfaceStartTask?.isCompleted() == true -> "completed"
                            else -> "pending"
                        }
                        showErrorFallback(
                            "Keyboard did not start within ${TOTAL_WATCHDOG_MS / 1000}s",
                            "isRunning=${safeIsRunning(surface)} jsReady=${KickKeyModule.keyboardJsReady} " +
                                "hostLifecycle=${app.keyboardReactHost.lifecycleState} " +
                                "startTask=$startState surfaceTask=$surfaceState " +
                                "view=${view?.width}×${view?.height} children=${view?.childCount ?: -1} " +
                                "resumeAttempts=$resumeAttempts resumeError=${resumeLastError ?: "none"} " +
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

    /**
     * Brings the keyboard ReactHost to LifecycleState.RESUMED so Fabric's
     * DispatchUIFrameCallback starts and applies the queued JS mount items to the surface
     * view (the ONLY thing that turns the black keyboard into visible keys).
     *
     * A normal RN app reaches RESUMED because its host Activity calls ReactHost.
     * onHostResume() in onResume(). An InputMethodService has no Activity, so the keyboard
     * host must be resumed explicitly — but ONLY after the JS is fully mounted.
     *
     * Why gate on [KickKeyModule.keyboardJsReady] instead of the instance/start task (a
     * previous iteration)?
     *  - Resuming before the instance existed moved the lifecycle to RESUMED prematurely
     *    and broke JS startup in release builds (silent host destroy → jsReady=false after
     *    17s, §16).
     *  - Resuming on startTask completion could fire while the JS bundle was still executing
     *    (the task completes when the instance is created, not when JS is up), and an 8s poll
     *    cap could expire entirely on a slow first cold start, leaving the host BEFORE_CREATE
     *    forever — both observed as black keyboards (§17).
     *  - keyboardJsReady only becomes true after the React root committed a frame: the
     *    instance, bundle, surface and every native module are then fully initialized.
     *    Resuming at that moment is exactly what a normal Activity does in onResume() after
     *    startup, with no bootstrap in flight.
     *
     * The poll is idempotent (moveToOnHostResume() early-returns once RESUMED) and retries
     * a failed resume until it sticks or the 30s window expires.
     */
    private fun scheduleJsReadyResume(app: KickKeyApplication) {
        resumeAttempts = 0
        resumeLastError = null
        val generation = ++resumeGeneration
        pollJsReadyResume(app, 0, generation)
    }

    private fun pollJsReadyResume(app: KickKeyApplication, attempt: Int, generation: Long) {
        // A newer open (or a teardown / watchdog give-up) bumped the generation — stop this
        // stale chain so it can never resume the wrong lifecycle or leak for 30s.
        if (generation != resumeGeneration) return
        // 120 × 250ms = 30s — comfortably beyond the watchdog's 17s give-up window, so a very
        // slow cold start (RN init + 1.2MB Hermes bundle + Fabric setup on slow hardware) still
        // gets its resume.
        if (attempt >= 120) {
            Log.w(TAG, "scheduleJsReadyResume: JS never signalled readiness — watchdog will surface the failure")
            return
        }
        mainHandler.postDelayed({
            try {
                if (generation != resumeGeneration) return@postDelayed
                val host = app.keyboardReactHost
                if (host.lifecycleState == LifecycleState.RESUMED) return@postDelayed // idempotent — done
                if (KickKeyModule.keyboardJsReady) {
                    resumeKeyboardHost(host)
                    // If the resume didn't take (it threw, or the lifecycle didn't move), retry
                    // — the watchdog's periodic checks will also retry while the keyboard is up.
                    if (host.lifecycleState != LifecycleState.RESUMED) {
                        pollJsReadyResume(app, attempt + 1, generation)
                    }
                } else {
                    pollJsReadyResume(app, attempt + 1, generation)
                }
            } catch (e: Exception) {
                Log.w(TAG, "pollJsReadyResume failed: ${e.message}")
            }
        }, 250)
    }

    private fun resumeKeyboardHost(host: ReactHost) {
        resumeAttempts++
        try {
            // Idempotent: if already RESUMED, moveToOnHostResume() early-returns. With jsReady
            // true the ReactInstance and JS are fully up, so this dispatches ReactContext.
            // onHostResume() cleanly → DispatchUIFrameCallback starts → the mount items queued
            // by the JS commit are applied on the next frame → keys appear.
            host.onHostResume(null)
            // Keep resumeLastError as-is: it records the most recent failure for the watchdog
            // error text (a flaky resume that eventually succeeded is still worth knowing about).
            Log.i(TAG, "Keyboard ReactHost resumed (lifecycle=${host.lifecycleState})")
        } catch (e: Exception) {
            // Never let a resume failure silently kill the keyboard — record it so the
            // watchdog surfaces it in the error text, and retry on the next poll.
            resumeLastError = e.message ?: e.javaClass.simpleName
            Log.w(TAG, "Keyboard ReactHost resume failed (attempt $resumeAttempts): ${e.message}")
        }
    }

    private fun safeIsRunning(surface: ReactSurface?): Boolean = try {
        surface?.isRunning == true
    } catch (e: Exception) {
        false
    }

    private fun showErrorFallback(reason: String, detail: String?) {
        Log.e(TAG, "showErrorFallback: $reason | $detail")
        // The keyboard has been declared dead — stop the resume poll so it can't resume a host
        // whose surface is about to be (or already was) detached by the error view.
        resumeGeneration++
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
                keyboardHeightPx
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
        // Stop any stale resume-poll chain (generation-guarded).
        resumeGeneration++
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
