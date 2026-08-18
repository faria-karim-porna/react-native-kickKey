package com.kickkey

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import com.facebook.react.ReactHost
import com.facebook.react.common.LifecycleState
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface

/**
 * KickKey's accessibility service (M1).
 *
 * Entry points:
 *  - The user assigns KickKey to the Accessibility button / shortcut
 *    (flagRequestAccessibilityButton in accessibility_service_config.xml).
 *    Tapping it fires [onAccessibilityButtonClicked] and toggles the
 *    floating panel — no input field is required.
 *  - The touchpad JS can also open/close the panel via KickKeyModule
 *    (same :ime_process, so the singleton is reachable without IPC).
 *
 * The floating panel is a TYPE_ACCESSIBILITY_OVERLAY window hosting the
 * "KickKeyOverlay" React surface from the pre-warmed keyboard ReactHost
 * (same Hermes bundle as the IME keyboard).
 *
 * Security/design rules (plan §18): the service performs NO data
 * collection. It only reacts to explicit user actions and renders the
 * panel. It does not read window content, filter key events, or request
 * touch exploration. onAccessibilityEvent stays a required no-op.
 */
class KickKeyAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "KickKeyA11y"

        // Panel = keyboard height + a slim header row. Same keyboard height
        // constant as the IME (KEYBOARD_HEIGHT_DP in KickKeyInputMethodService).
        private const val PANEL_MARGIN_DP = 12
        private const val PANEL_HEIGHT_DP = 300

        // Singleton so KickKeyModule (same :ime_process) reaches the service
        // without any IPC. @Volatile: written on the system binder thread
        // (onServiceConnected), read on the main thread.
        @Volatile
        var instance: KickKeyAccessibilityService? = null
            private set
    }

    private val mainHandler = Handler(Looper.getMainLooper())

    private var panelSurface: ReactSurface? = null
    private var panelContainer: FrameLayout? = null
    private var panelSurfaceTask: TaskInterface<Void>? = null
    private var isPanelShowing = false

    private val panelMarginPx: Int
        get() = (PANEL_MARGIN_DP * resources.displayMetrics.density).toInt()
    private val panelWidthPx: Int
        get() = (resources.displayMetrics.widthPixels - 2 * panelMarginPx).coerceAtLeast(1)
    private val panelHeightPx: Int
        get() = (PANEL_HEIGHT_DP * resources.displayMetrics.density).toInt()

    // ── Service lifecycle ──────────────────────────────────────────────────

    private var buttonCallback: Any? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "Accessibility service connected")

        // Register callback for the on-screen / nav-bar Accessibility button (API 26+)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            try {
                val callback = object : android.accessibilityservice.AccessibilityButtonController.AccessibilityButtonCallback() {
                    override fun onClicked(controller: android.accessibilityservice.AccessibilityButtonController) {
                        Log.i(TAG, "Accessibility button clicked — toggling floating panel")
                        toggleFloatingPanel()
                    }

                    override fun onAvailabilityChanged(
                        controller: android.accessibilityservice.AccessibilityButtonController,
                        available: Boolean
                    ) {
                        Log.i(TAG, "Accessibility button availability changed: $available")
                    }
                }
                accessibilityButtonController.registerAccessibilityButtonCallback(callback)
                buttonCallback = callback
                Log.i(TAG, "Registered AccessibilityButtonCallback")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to register AccessibilityButtonCallback: ${e.message}")
            }
        }
    }

    // Required override. Intentionally empty — the service does not consume
    // window content (no data collection, plan §18).
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    }

    // Required override.
    override fun onInterrupt() {
    }

    override fun onUnbind(intent: Intent?): Boolean {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            (buttonCallback as? android.accessibilityservice.AccessibilityButtonController.AccessibilityButtonCallback)?.let {
                try {
                    accessibilityButtonController.unregisterAccessibilityButtonCallback(it)
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to unregister AccessibilityButtonCallback: ${e.message}")
                }
            }
            buttonCallback = null
        }
        hideFloatingPanel()
        instance = null
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        hideFloatingPanel()
        instance = null
        super.onDestroy()
    }

    // ── Floating panel toggle ──────────────────────────────────────────────

    fun toggleFloatingPanel() {
        mainHandler.post {
            if (isPanelShowing) hideFloatingPanel() else showFloatingPanel()
        }
    }

    // ── Floating panel ─────────────────────────────────────────────────────

    fun isPanelVisible(): Boolean = isPanelShowing

    fun showFloatingPanel() {
        if (isPanelShowing) return
        val app = application as? KickKeyApplication ?: run {
            Log.e(TAG, "KickKeyApplication not found — cannot create panel")
            return
        }

        try {
            val host = app.keyboardReactHost

            // Second surface from the SAME host + bundle as the IME keyboard.
            // The name must match the AppRegistry registration in keyboard.index.js.
            val surface = host.createSurface(this, "KickKeyOverlay", null)
            panelSurfaceTask = surface.start()
            panelSurface = surface

            val container = FrameLayout(this).apply {
                layoutParams = FrameLayout.LayoutParams(panelWidthPx, panelHeightPx)
                setBackgroundColor(android.graphics.Color.TRANSPARENT)
            }
            surface.view?.let { view ->
                container.addView(
                    view,
                    FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    )
                )
            }

            val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val params = WindowManager.LayoutParams(
                panelWidthPx,
                panelHeightPx,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or      // never steal keyboard focus
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or // touches outside pass through
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
            ).apply {
                // Position: bottom-center of the screen. x/y are absolute screen
                // coordinates with gravity TOP|START (dragging arrives later).
                gravity = Gravity.TOP or Gravity.START
                x = panelMarginPx
                y = resources.displayMetrics.heightPixels - panelHeightPx - panelMarginPx
            }

            wm.addView(container, params)
            panelContainer = container
            isPanelShowing = true

            // Fabric needs the host RESUMED to apply mount items (the exact same
            // mechanism the IME watchdog uses). Poll until the JS signals
            // readiness (keyboardReady), then resume — idempotent if already up.
            resumeHostWhenReady(host, 0)
            Log.i(TAG, "Floating panel shown (${panelWidthPx}x${panelHeightPx})")
        } catch (e: Throwable) {
            Log.e(TAG, "showFloatingPanel failed", e)
        }
    }

    fun hideFloatingPanel() {
        if (!isPanelShowing) return
        isPanelShowing = false
        try {
            panelContainer?.let {
                (getSystemService(Context.WINDOW_SERVICE) as WindowManager).removeView(it)
            }
        } catch (e: Exception) {
            Log.w(TAG, "hideFloatingPanel: removeView failed: ${e.message}")
        }
        panelContainer = null
        try {
            panelSurface?.stop()
        } catch (e: Exception) {
            Log.w(TAG, "hideFloatingPanel: surface stop failed: ${e.message}")
        }
        panelSurface = null
        panelSurfaceTask = null
        Log.i(TAG, "Floating panel hidden")
    }

    /**
     * Polls (50ms × up to 600 ≈ 30s) for the keyboard JS mount signal, then
     * resumes the keyboard ReactHost so Fabric's DispatchUIFrameCallback starts
     * applying mount items to the panel surface. Mirrors the IME's
     * scheduleJsReadyResume() in KickKeyInputMethodService, simplified for M1.
     */
    private fun resumeHostWhenReady(host: ReactHost, attempt: Int) {
        if (!isPanelShowing) return
        if (attempt >= 600) {
            Log.w(TAG, "Panel: JS never signalled readiness — panel may stay blank (see Troubleshooting §7)")
            return
        }
        mainHandler.postDelayed({
            if (!isPanelShowing) return@postDelayed
            // Idempotent: if the IME already resumed the host, we're done.
            if (host.lifecycleState == LifecycleState.RESUMED) return@postDelayed
            if (KickKeyModule.keyboardJsReady) {
                try {
                    host.onHostResume(null)
                    Log.i(TAG, "Panel: host resumed (lifecycle=${host.lifecycleState})")
                } catch (e: Exception) {
                    Log.w(TAG, "Panel: host resume failed: ${e.message}")
                    resumeHostWhenReady(host, attempt + 1)
                }
            } else {
                resumeHostWhenReady(host, attempt + 1)
            }
        }, 50)
    }
}
