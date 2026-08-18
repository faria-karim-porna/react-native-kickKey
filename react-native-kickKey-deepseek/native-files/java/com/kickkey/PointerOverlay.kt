package com.kickkey

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.accessibility.AccessibilityManager
import android.widget.FrameLayout
import com.facebook.react.ReactHost
import com.facebook.react.common.LifecycleState
import com.facebook.react.interfaces.fabric.ReactSurface

/**
 * M2 — the system-wide on-screen mouse cursor.
 *
 * The cursor is a small React Native surface ("KickKeyPointer", from the
 * keyboard ReactHost / keyboard.bundle) placed in its own overlay window.
 * Native owns the position (cursorX/cursorY); the RN arrow never re-renders
 * while moving — movement is pure WindowManager.updateViewLayout().
 *
 * Window type priority (plan §6):
 *   1. TYPE_ACCESSIBILITY_OVERLAY — KickKeyAccessibilityService enabled
 *      (no SYSTEM_ALERT_WINDOW needed).
 *   2. TYPE_APPLICATION_OVERLAY (or TYPE_PHONE on API 24-25) — IME-only
 *      fallback, requires "Display over other apps".
 *   3. Neither → show() returns false; JS shows the permission banner.
 *
 * Threading: all methods are MAIN-THREAD ONLY. KickKeyModule posts to the
 * main looper before calling (same pattern as the removed ImageView code).
 *
 * The surface is created lazily on first show and kept alive for the process
 * lifetime (a tiny static arrow — no per-move re-renders).
 */
object PointerOverlay {

    private const val TAG = "KickKeyPointer"
    private const val CURSOR_SIZE_DP = 32

    private val mainHandler = Handler(Looper.getMainLooper())

    private var appContext: Context? = null
    private var cursorSurface: ReactSurface? = null
    private var cursorView: View? = null
    private var visible = false

    // Single source of truth for the cursor position (screen coordinates of
    // the window's top-left corner). Read by M3's click/scroll methods.
    var cursorX = 0f
        private set
    var cursorY = 0f
        private set

    private val cursorSizePx: Int
        get() = (CURSOR_SIZE_DP * (appContext?.resources?.displayMetrics?.density ?: 1f)).toInt()

    private fun screenWidthPx(): Int = appContext?.resources?.displayMetrics?.widthPixels ?: 0
    private fun screenHeightPx(): Int = appContext?.resources?.displayMetrics?.heightPixels ?: 0

    private fun isAccessibilityServiceEnabled(context: Context): Boolean {
        // Direct singleton check (same :ime_process)
        if (KickKeyAccessibilityService.instance != null) return true

        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        val enabledViaManager = am
            ?.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
            ?.any { info ->
                val sInfo = info.resolveInfo?.serviceInfo
                (sInfo?.packageName == context.packageName &&
                    (sInfo.name == "com.kickkey.KickKeyAccessibilityService" ||
                     sInfo.name?.endsWith("KickKeyAccessibilityService") == true)) ||
                info.id?.contains("KickKeyAccessibilityService") == true
            }
            ?: false

        if (enabledViaManager) return true

        val raw = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        return raw.contains("KickKeyAccessibilityService")
    }

    /** Returns the window type to use, or null when no overlay channel exists. */
    private fun resolveWindowType(context: Context): Int? {
        if (isAccessibilityServiceEnabled(context)) {
            return WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
        }
        return when {
            Settings.canDrawOverlays(context) -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }
            }
            else -> null
        }
    }

    /**
     * Shows the cursor. Returns false when no overlay channel is available
     * (JS then shows the permission banner). Main thread only.
     */
    fun show(context: Context): Boolean {
        if (visible) return true
        appContext = context.applicationContext
        val type = resolveWindowType(context) ?: return false

        if (cursorSurface == null) {
            if (!createSurface(context)) return false
        }
        visible = true
        attachWindow(type, 0)
        return true
    }

    /**
     * Moves the cursor by a RELATIVE (dx, dy) delta, clamped to the whole
     * screen (0..screenW, 0..screenH — no "above the keyboard" limit).
     * Main thread only. Called at most once per frame from JS.
     */
    fun move(dx: Float, dy: Float) {
        val view = cursorView ?: return
        try {
            val wm = appContext?.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return
            val size = cursorSizePx
            cursorX = (cursorX + dx).coerceIn(0f, (screenWidthPx() - size).coerceAtLeast(0).toFloat())
            cursorY = (cursorY + dy).coerceIn(0f, (screenHeightPx() - size).coerceAtLeast(0).toFloat())
            val params = view.layoutParams as WindowManager.LayoutParams
            params.x = cursorX.toInt()
            params.y = cursorY.toInt()
            wm.updateViewLayout(view, params)
        } catch (e: Exception) {
            Log.w(TAG, "move failed: ${e.message}")
        }
    }

    /** Hides the cursor (window removed; the surface stays alive). Main thread only. */
    fun hide() {
        if (!visible && cursorView == null) return
        visible = false
        try {
            cursorView?.let { container ->
                (container as? FrameLayout)?.removeAllViews()
                (appContext?.getSystemService(Context.WINDOW_SERVICE) as? WindowManager)?.removeView(container)
            }
        } catch (e: Exception) {
            Log.w(TAG, "hide failed: ${e.message}")
        }
        cursorView = null
        Log.i(TAG, "Cursor hidden")
    }

    fun isVisible(): Boolean = visible

    // ── Internals ──────────────────────────────────────────────────────────

    private fun createSurface(context: Context): Boolean {
        return try {
            val app = context.applicationContext as KickKeyApplication
            val host = app.keyboardReactHost
            val surface = host.createSurface(app, "KickKeyPointer", null)
            surface.start()
            cursorSurface = surface
            // Fabric needs the host RESUMED to apply mount items (same mechanism
            // as the IME watchdog). PointerRoot signals readiness via keyboardReady().
            resumeHostWhenReady(host, 0)
            Log.i(TAG, "Cursor ReactSurface created and started")
            true
        } catch (e: Throwable) {
            Log.e(TAG, "createSurface failed", e)
            false
        }
    }

    /**
     * Attaches the surface view to the overlay window. The surface view can be
     * null briefly right after start(); retry for ~1s. Aborts if hide() ran.
     */
    private fun attachWindow(type: Int, attempt: Int) {
        if (!visible) return
        val surface = cursorSurface ?: return
        val surfaceView = surface.view
        if (surfaceView == null) {
            if (attempt < 10) {
                mainHandler.postDelayed({ attachWindow(type, attempt + 1) }, 100)
            } else {
                Log.e(TAG, "Cursor surface view never appeared — resetting for next show")
                visible = false
            }
            return
        }
        try {
            val wm = appContext?.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return
            val size = cursorSizePx

            // Detach from previous parent if already attached to avoid IllegalStateException
            (surfaceView.parent as? ViewGroup)?.removeView(surfaceView)

            val container = FrameLayout(appContext).apply {
                layoutParams = FrameLayout.LayoutParams(size, size)
                setBackgroundColor(android.graphics.Color.TRANSPARENT)
            }
            container.addView(
                surfaceView,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )

            val params = WindowManager.LayoutParams(
                size,
                size,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                // Center on screen on first show; preserve position between subsequent drags
                if (cursorX == 0f && cursorY == 0f) {
                    cursorX = (screenWidthPx() - size) / 2f
                    cursorY = (screenHeightPx() - size) / 2f
                }
                x = cursorX.toInt()
                y = cursorY.toInt()
            }

            wm.addView(container, params)
            cursorView = container
            Log.i(TAG, "Cursor window attached (type=$type, $size x $size px at $cursorX,$cursorY)")
        } catch (e: Throwable) {
            Log.e(TAG, "attachWindow failed", e)
            visible = false
            cursorView = null
        }
    }

    /**
     * Polls (50ms × up to 600 ≈ 30s) for the keyboard JS mount signal, then
     * resumes the keyboard ReactHost so Fabric's DispatchUIFrameCallback applies
     * this surface's mount items. Idempotent if the host is already RESUMED.
     */
    private fun resumeHostWhenReady(host: ReactHost, attempt: Int) {
        if (!visible) return
        if (attempt >= 600) {
            Log.w(TAG, "Cursor: JS never signalled readiness — cursor may stay blank (see Troubleshooting §6)")
            return
        }
        mainHandler.postDelayed({
            if (!visible) return@postDelayed
            if (host.lifecycleState == LifecycleState.RESUMED) return@postDelayed
            if (KickKeyModule.keyboardJsReady) {
                try {
                    host.onHostResume(null)
                    Log.i(TAG, "Cursor: host resumed (lifecycle=${host.lifecycleState})")
                } catch (e: Exception) {
                    Log.w(TAG, "Cursor: host resume failed: ${e.message}")
                    resumeHostWhenReady(host, attempt + 1)
                }
            } else {
                resumeHostWhenReady(host, attempt + 1)
            }
        }, 50)
    }
}
