package com.kickkey

import android.inputmethodservice.InputMethodService
import android.util.Log
import android.view.View
import android.view.inputmethod.EditorInfo
import com.facebook.react.ReactRootView

class KickKeyInputMethodService : InputMethodService() {

    companion object {
        private const val TAG = "KickKeyIME"
    }

    private var reactRootView: ReactRootView? = null

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "IME Service created")
    }

    /**
     * Called by Android when a text field receives focus and the user
     * needs to see the keyboard. Must return a View synchronously.
     */
    override fun onCreateInputView(): View {
        Log.i(TAG, "onCreateInputView called")

        val app = application as? KickKeyApplication
        if (app == null) {
            Log.e(TAG, "KickKeyApplication not found — returning fallback view")
            return View(this)
        }

        // Wait for ReactInstanceManager to initialize if needed
        if (!app::reactInstanceManager.isInitialized) {
            Log.w(TAG, "reactInstanceManager not initialized yet — sleeping 100ms")
            try {
                Thread.sleep(100)
            } catch (e: InterruptedException) {
                // Ignore
            }
        }

        // Create a ReactRootView — this IS an Android View
        // Android will receive this as the keyboard surface
        reactRootView = ReactRootView(this)
        reactRootView!!.startReactApplication(
            app.reactInstanceManager,
            "KickKeyKeyboard",   // must match AppRegistry.registerComponent in keyboard.index.js
            null                 // no initial props
        )

        Log.i(TAG, "ReactRootView created and started")
        return reactRootView!!
    }

    override fun onStartInputView(info: EditorInfo, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        Log.i(TAG, "Input started — inputType: ${info.inputType}")
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        Log.i(TAG, "Input finished")
    }

    override fun onWindowHidden() {
        super.onWindowHidden()
        Log.i(TAG, "Keyboard hidden")
    }

    override fun onDestroy() {
        // Clean up ReactRootView to avoid memory leaks
        reactRootView?.unmountReactApplication()
        reactRootView = null
        super.onDestroy()
        Log.i(TAG, "IME Service destroyed")
    }
}
