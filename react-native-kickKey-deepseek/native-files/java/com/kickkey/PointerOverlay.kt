package com.kickkey

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityManager

/**
 * M2 — the system-wide on-screen mouse cursor and touch-through touchpad overlay.
 *
 * Cursor is drawn by a pure-native [CursorView] (Canvas-based) rendered as a modern
 * macOS / Windows 11 style sleek pointer with soft drop shadow and crisp outline.
 * Screen overlay is drawn by a pure-native [TouchpadOverlayView] (Canvas-based)
 * covering the entire screen except the keyboard area with 50% opacity red.
 * Movement is pure WindowManager.updateViewLayout() — no re-renders.
 *
 * Window type priority:
 *   1. TYPE_ACCESSIBILITY_OVERLAY — KickKeyAccessibilityService enabled (no
 *      SYSTEM_ALERT_WINDOW permission needed).
 *   2. TYPE_APPLICATION_OVERLAY (API 26+) or TYPE_PHONE — "Display over other
 *      apps" granted.
 *   3. Neither → show() returns false; JS shows the permission banner.
 *
 * All public methods are MAIN-THREAD ONLY. KickKeyModule posts to the main
 * looper before calling.
 */
object PointerOverlay {

    private const val TAG = "KickKeyPointer"

    /** Modern cursor arrow size in dp. */
    private const val CURSOR_SIZE_DP = 28
    /** Keyboard height in dp to calculate the overlay area excluding keyboard. */
    private const val KEYBOARD_HEIGHT_DP = 275

    private val mainHandler = Handler(Looper.getMainLooper())

    private var appContext: Context? = null
    private var cursorView: View? = null
    private var screenOverlayView: View? = null
    private var visible = false
    private var currentWindowType: Int? = null

    /**
     * Explicit overlay top-Y set by JS via pointerSetOverlayTopY().
     * JS measures the exact on-screen Y of mainKeysContainer (the main keyboard
     * area) so the overlay height stops precisely at the top of the key rows,
     * NOT at the top of the toggle/slider row above them.
     * -1 means "not set yet; fall back to container measurement".
     */
    var overlayTopYOverride: Int = -1

    /** Screen coordinates of the cursor's hotspot (top-left of the window). */
    var cursorX = 0f
        private set
    var cursorY = 0f
        private set

    private val cursorSizePx: Int
        get() = (CURSOR_SIZE_DP * (appContext?.resources?.displayMetrics?.density ?: 3f)).toInt()

    private val keyboardHeightPx: Int
        get() = (KEYBOARD_HEIGHT_DP * (appContext?.resources?.displayMetrics?.density ?: 3f)).toInt()

    private fun getWindowManager(type: Int? = currentWindowType): WindowManager? {
        if (type == WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY) {
            KickKeyAccessibilityService.instance?.let { a11y ->
                return a11y.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
            }
        }
        val ctx = appContext ?: return null
        return ctx.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
    }

    private fun getOverlayContext(type: Int): Context? {
        if (type == WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY) {
            val a11y = KickKeyAccessibilityService.instance
            if (a11y != null) return a11y
        }
        return appContext
    }

    /**
     * Calculates the exact Y-coordinate (pixels) of the top edge of the main
     * keyboard area (below the toggle/slider row).
     * Priority:
     *   1. [overlayTopYOverride] — set by JS from measureInWindow on mainKeysContainer
     *   2. Native container getLocationOnScreen (top of whole panel, fallback)
     *   3. Arithmetic fallback (screen height − keyboard height dp)
     */
    fun getKeyboardTopY(): Int {
        // 1. JS-supplied precise coordinate from mainKeysContainer.measureInWindow
        if (overlayTopYOverride > 0) return overlayTopYOverride

        val loc = IntArray(2)
        KickKeyAccessibilityService.instance?.panelContainer?.let { container ->
            if (container.isAttachedToWindow && container.height > 0) {
                container.getLocationOnScreen(loc)
                if (loc[1] > 0) return loc[1]
            }
        }
        KickKeyInputMethodService.instance?.keyboardContainer?.let { container ->
            if (container.isAttachedToWindow && container.height > 0) {
                container.getLocationOnScreen(loc)
                if (loc[1] > 0) return loc[1]
            }
        }
        // Fallback calculation using screen height and keyboard height
        val ctx = appContext ?: return 0
        val displayH = ctx.resources.displayMetrics.heightPixels
        val kbH = keyboardHeightPx
        return (displayH - kbH).coerceAtLeast(0)
    }

    private fun screenWidthPx(): Int {
        val ctx = appContext ?: return 1080
        val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            wm?.currentWindowMetrics?.bounds?.width()
                ?: ctx.resources.displayMetrics.widthPixels
        } else {
            val dm = android.util.DisplayMetrics()
            @Suppress("DEPRECATION")
            wm?.defaultDisplay?.getRealMetrics(dm)
            if (dm.widthPixels > 0) dm.widthPixels else ctx.resources.displayMetrics.widthPixels
        }
    }

    private fun screenHeightPx(): Int {
        val ctx = appContext ?: return 1920
        val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            wm?.currentWindowMetrics?.bounds?.height()
                ?: ctx.resources.displayMetrics.heightPixels
        } else {
            val dm = android.util.DisplayMetrics()
            @Suppress("DEPRECATION")
            wm?.defaultDisplay?.getRealMetrics(dm)
            if (dm.heightPixels > 0) dm.heightPixels else ctx.resources.displayMetrics.heightPixels
        }
    }

    // ── Window type resolution ─────────────────────────────────────────────

    private fun resolveWindowType(ctx: Context): Int? {
        if (KickKeyAccessibilityService.instance != null)
            return WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
        return when {
            Settings.canDrawOverlays(ctx) -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
            else -> null
        }
    }

    // ── Public API ────────────────────────────────────────────────────────

    /**
     * Shows the cursor overlay and touch-through red screen overlay. Returns false when no overlay channel is
     * available (JS then shows the permission banner). Main thread only.
     */
    fun show(context: Context): Boolean {
        appContext = context.applicationContext
        val type = resolveWindowType(context) ?: return false
        if (visible && cursorView != null && screenOverlayView != null) return true
        attachWindow(type)
        return true
    }

    /**
     * Moves the cursor by a relative (dx, dy) delta, clamped to the screen and above keyboard.
     * Main thread only.
     */
    fun move(dx: Float, dy: Float) {
        val view = cursorView ?: return
        val wm = getWindowManager() ?: return
        try {
            val size = cursorSizePx
            val overlayH = getKeyboardTopY()
            val maxCursorY = if (overlayH > size) (overlayH - size).toFloat() else (screenHeightPx() - size).coerceAtLeast(0).toFloat()
            cursorX = (cursorX + dx).coerceIn(0f, (screenWidthPx() - size).coerceAtLeast(0).toFloat())
            cursorY = (cursorY + dy).coerceIn(0f, maxCursorY)
            val params = view.layoutParams as WindowManager.LayoutParams
            params.x = cursorX.toInt()
            params.y = cursorY.toInt()
            wm.updateViewLayout(view, params)
        } catch (e: Exception) {
            Log.w(TAG, "move failed: ${e.message}")
        }
    }

    /** Hides the cursor window and screen overlay. Main thread only. */
    fun hide() {
        if (!visible && cursorView == null && screenOverlayView == null) return
        visible = false
        val wm = getWindowManager()
        try {
            screenOverlayView?.let { v -> wm?.removeView(v) }
        } catch (e: Exception) {
            Log.w(TAG, "hide screenOverlayView failed: ${e.message}")
        }
        screenOverlayView = null
        try {
            cursorView?.let { v -> wm?.removeView(v) }
        } catch (e: Exception) {
            Log.w(TAG, "hide cursorView failed: ${e.message}")
        }
        cursorView = null
        currentWindowType = null
        Log.i(TAG, "Cursor and overlay hidden")
    }

    fun isVisible(): Boolean = visible

    /**
     * Re-measures the keyboard top and updates the overlay height.
     */
    fun updateOverlayBounds() {
        if (!visible) return
        val redOverlay = screenOverlayView ?: return
        val wm = getWindowManager() ?: return
        val overlayH = getKeyboardTopY()
        if (overlayH <= 0) return
        try {
            val params = redOverlay.layoutParams as? WindowManager.LayoutParams ?: return
            if (params.height != overlayH) {
                params.height = overlayH
                wm.updateViewLayout(redOverlay, params)
                Log.i(TAG, "Updated overlay height to ${overlayH}px (top of keyboard)")
            }
        } catch (e: Exception) {
            Log.w(TAG, "updateOverlayBounds failed: ${e.message}")
        }
    }

    // ── Internals ─────────────────────────────────────────────────────────

    private fun attachWindow(type: Int) {
        val targetContext = getOverlayContext(type) ?: return
        val wm = getWindowManager(type) ?: return
        try {
            currentWindowType = type
            val size = cursorSizePx
            val screenW = screenWidthPx()
            val overlayH = getKeyboardTopY()

            // Centre on first show; preserve position on subsequent shows.
            if (cursorX == 0f && cursorY == 0f) {
                cursorX = (screenW - size) / 2f
                cursorY = if (overlayH > size) (overlayH - size) / 2f else 0f
            } else {
                val maxCursorY = if (overlayH > size) (overlayH - size).toFloat() else 0f
                cursorY = cursorY.coerceIn(0f, maxCursorY)
            }

            // Clean up existing views if any
            try {
                screenOverlayView?.let { v -> wm.removeView(v) }
            } catch (e: Exception) {}
            screenOverlayView = null

            try {
                cursorView?.let { v -> wm.removeView(v) }
            } catch (e: Exception) {}
            cursorView = null

            // 1. Red 50% opacity touch-through screen overlay (covers entire screen above keyboard)
            val redOverlay = TouchpadOverlayView(targetContext)
            val overlayParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                if (overlayH > 0) overlayH else WindowManager.LayoutParams.MATCH_PARENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = 0
                y = 0
            }
            wm.addView(redOverlay, overlayParams)
            screenOverlayView = redOverlay

            // 2. Cursor View (Modern Sleek Pointer)
            val view = CursorView(targetContext)
            val params = WindowManager.LayoutParams(
                size, size,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = cursorX.toInt()
                y = cursorY.toInt()
            }

            wm.addView(view, params)
            cursorView = view
            visible = true
            Log.i(TAG, "Cursor & screen overlay attached (type=$type, overlayH=${overlayH}px, cursor=${size}px at $cursorX,$cursorY)")

            // Follow-up check to make sure height is snapped to keyboard if layout finished after attach
            mainHandler.postDelayed({
                updateOverlayBounds()
            }, 60)
        } catch (e: Throwable) {
            Log.e(TAG, "attachWindow failed", e)
            visible = false
            cursorView = null
            screenOverlayView = null
            currentWindowType = null
        }
    }

    // ── Native touch-through red overlay drawing ───────────────────────────

    private class TouchpadOverlayView(ctx: Context) : View(ctx) {
        private val paint = Paint().apply {
            color = Color.argb(128, 255, 0, 0) // 50% opacity red (#80FF0000)
            style = Paint.Style.FILL
        }

        init {
            setWillNotDraw(false)
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
        }
    }

    // ── Native cursor drawing (Modern macOS / Windows 11 sleek style) ──────

    /**
     * A lightweight View that draws a modern macOS / Windows 11 style sleek
     * mouse-pointer arrow with a soft drop shadow, crisp white body, and dark outline.
     *
     * The arrow tip is at the View's top-left corner (0,0) (the hotspot used by
     * M3's click/scroll methods via [cursorX]/[cursorY]).
     */
    private class CursorView(ctx: Context) : View(ctx) {

        // Ambient soft shadow (outer diffuse)
        private val ambientShadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(45, 0, 0, 0)
            style = Paint.Style.FILL
        }

        // Contact shadow (inner darker)
        private val contactShadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(75, 0, 0, 0)
            style = Paint.Style.FILL
        }

        // Crisp white fill
        private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.FILL
        }

        // Refined dark slate outline
        private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(235, 18, 18, 30)
            style = Paint.Style.STROKE
            strokeWidth = 2.4f
            strokeJoin = Paint.Join.ROUND
            strokeCap = Paint.Cap.ROUND
        }

        private val arrowPath = Path()
        private val ambientShadowPath = Path()
        private val contactShadowPath = Path()

        init {
            setWillNotDraw(false)
        }

        override fun onSizeChanged(w: Int, h: Int, oldW: Int, oldH: Int) {
            super.onSizeChanged(w, h, oldW, oldH)
            buildModernArrow(w.toFloat(), h.toFloat())
        }

        /**
         * Builds a modern macOS / Windows 11 style sleek pointer cursor.
         * Normalized points on a 24 x 30 grid.
         */
        private fun buildModernArrow(w: Float, h: Float) {
            val pts = arrayOf(
                floatArrayOf(0f,    0f),    // tip
                floatArrayOf(0f,    21f),   // left edge down
                floatArrayOf(5.5f,  16.5f), // inner notch
                floatArrayOf(10.5f, 26.5f), // tail left
                floatArrayOf(14.2f, 24.6f), // tail right
                floatArrayOf(9.2f,  14.8f), // tail top-right notch
                floatArrayOf(17.8f, 14.8f), // right wing
                floatArrayOf(0f,    0f)     // back to tip
            )

            val scaleX = w / 24f
            val scaleY = h / 30f

            arrowPath.reset()
            arrowPath.moveTo(pts[0][0] * scaleX, pts[0][1] * scaleY)
            for (i in 1 until pts.size) {
                arrowPath.lineTo(pts[i][0] * scaleX, pts[i][1] * scaleY)
            }
            arrowPath.close()

            // Ambient soft shadow (offset down-right)
            val ambOffsetX = 2.5f * scaleX
            val ambOffsetY = 3.5f * scaleY
            ambientShadowPath.reset()
            ambientShadowPath.moveTo(pts[0][0] * scaleX + ambOffsetX, pts[0][1] * scaleY + ambOffsetY)
            for (i in 1 until pts.size) {
                ambientShadowPath.lineTo(pts[i][0] * scaleX + ambOffsetX, pts[i][1] * scaleY + ambOffsetY)
            }
            ambientShadowPath.close()

            // Contact shadow
            val contactOffsetX = 1.2f * scaleX
            val contactOffsetY = 1.6f * scaleY
            contactShadowPath.reset()
            contactShadowPath.moveTo(pts[0][0] * scaleX + contactOffsetX, pts[0][1] * scaleY + contactOffsetY)
            for (i in 1 until pts.size) {
                contactShadowPath.lineTo(pts[i][0] * scaleX + contactOffsetX, pts[i][1] * scaleY + contactOffsetY)
            }
            contactShadowPath.close()
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            canvas.drawPath(ambientShadowPath, ambientShadowPaint)
            canvas.drawPath(contactShadowPath, contactShadowPaint)
            canvas.drawPath(arrowPath, fillPaint)
            canvas.drawPath(arrowPath, strokePaint)
        }
    }
}
