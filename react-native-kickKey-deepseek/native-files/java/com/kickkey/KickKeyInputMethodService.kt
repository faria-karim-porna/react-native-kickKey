package com.kickkey

import android.inputmethodservice.InputMethodService
import android.util.Log
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DeviceEventManagerModule

class KickKeyInputMethodService : InputMethodService() {

    companion object {
        private const val TAG = "KickKeyIME"
        // Standard keyboard height in pixels (~280dp at 2.75 density)
        private const val KEYBOARD_HEIGHT_PX = 770
    }

    private var reactSurface: ReactSurface? = null
    private var keyboardContainer: FrameLayout? = null

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
            surface.start()
            reactSurface = surface

            val surfaceView = surface.view
            if (surfaceView != null) {
                Log.i(TAG, "Keyboard surface view created — wrapping in FrameLayout")

                // Wrap the React surface in a FrameLayout with explicit height.
                // The IME framework needs the view to report a non-zero height
                // during onMeasure, otherwise it shows an empty shadow window.
                val container = FrameLayout(this).apply {
                    layoutParams = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.WRAP_CONTENT
                    )
                    // Set minHeight so the container never collapses to 0
                    minimumHeight = KEYBOARD_HEIGHT_PX
                    setBackgroundColor(0x00000000) // Transparent - React surface will render its own bg
                }
                container.addView(surfaceView, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ))
                keyboardContainer = container

                Log.i(TAG, "Keyboard view created successfully — returning container")
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
        try {
            reactSurface?.stop()
            reactSurface = null
            keyboardContainer?.removeAllViews()
            keyboardContainer = null
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
    ) {
        try {
            val app = application as? KickKeyApplication ?: return
            val reactContext = app.keyboardReactHost.currentReactContext ?: return
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
