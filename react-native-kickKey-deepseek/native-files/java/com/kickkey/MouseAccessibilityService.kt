package com.kickkey

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility service that powers the touchpad (mouse) mode.
 *
 * Android does not let ordinary apps inject pointer events into other apps —
 * the only non-root path is an AccessibilityService using
 * `dispatchGesture()` (API 24+) plus a `TYPE_ACCESSIBILITY_OVERLAY` window
 * (API 22+) to draw a visible cursor. The user enables "KickKey Mouse
 * Control" once in Settings → Accessibility.
 *
 * This service is declared with `android:process=":ime_process"` (same
 * process as the IME + KickKeyModule), so the module can reach it through
 * the static `companion object` bridge — no cross-process IPC needed.
 *
 * API surface used by the JS touchpad (via KickKeyModule):
 *   - moveCursor(dxDp, dyDp)  relative movement (dp), clamped to the screen
 *   - click()                 left click (single tap at the cursor)
 *   - rightClick()            right click (two-finger tap at the cursor)
 *   - scroll(dyDp)            drag/swipe at the cursor (positive = down)
 *   - showCursor()/hideCursor()  overlay visibility
 *   - isConnected             true while the service is bound
 */
class MouseAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "MouseAccessibilityService"
        private var instance: MouseAccessibilityService? = null

        val isConnected: Boolean
            get() = instance != null

        /** Runs [block] on the service's main thread (WindowManager is main-thread only). */
        private fun withService(block: (MouseAccessibilityService) -> Unit) {
            val service = instance ?: return
            service.mainHandler.post { block(service) }
        }

        fun moveCursor(dxDp: Float, dyDp: Float) = withService { it.moveCursor(dxDp, dyDp) }
        fun click() = withService { it.dispatchTap(strokes = 1) }
        fun rightClick() = withService { it.dispatchTap(strokes = 2) }
        fun scroll(dyDp: Float) = withService { it.dispatchScroll(dyDp) }
        fun showCursor() = withService { it.showCursor() }
        fun hideCursor() = withService { it.hideCursor() }
    }

    private val mainHandler = Handler(Looper.getMainLooper())

    private var wm: WindowManager? = null
    private var cursorView: View? = null
    private var cursorParams: WindowManager.LayoutParams? = null
    private var cursorX = 0f
    private var cursorY = 0f
    private var screenW = 0
    private var screenH = 0
    private var density = 1f

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val dm: DisplayMetrics = resources.displayMetrics
        density = dm.density
        screenW = dm.widthPixels
        screenH = dm.heightPixels
        // Start centered so a fresh session doesn't begin at a screen corner.
        cursorX = screenW / 2f
        cursorY = screenH / 2f
        Log.i(TAG, "Accessibility service connected")
    }

    override fun onDestroy() {
        hideCursor()
        instance = null
        super.onDestroy()
        Log.i(TAG, "Accessibility service disconnected")
    }

    // We don't act on accessibility events — the service is only a vehicle
    // for the overlay + gesture injection.
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}

    // ── Cursor overlay ─────────────────────────────────────────────────────

    private fun showCursor() {
        if (Build.VERSION.SDK_INT < 22) return
        val manager = wm ?: return
        if (cursorView != null) {
            positionCursor()
            return
        }
        // 28dp so the 26dp-tall arrow (plus its outline stroke) fits with margin.
        val size = (28 * density).toInt()
        val view = CursorView(this, density)
        val params = WindowManager.LayoutParams(
            size,
            size,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = cursorX.toInt()
            y = cursorY.toInt()
        }
        try {
            manager.addView(view, params)
            cursorView = view
            cursorParams = params
            Log.i(TAG, "Cursor overlay shown")
        } catch (e: Exception) {
            Log.w(TAG, "showCursor failed: ${e.message}")
        }
    }

    private fun hideCursor() {
        val view = cursorView ?: return
        try {
            wm?.removeView(view)
        } catch (e: Exception) {
            // View already removed — fine
        }
        cursorView = null
        cursorParams = null
        Log.i(TAG, "Cursor overlay hidden")
    }

    private fun positionCursor() {
        val view = cursorView ?: return
        val params = cursorParams ?: return
        params.x = cursorX.toInt()
        params.y = cursorY.toInt()
        try {
            wm?.updateViewLayout(view, params)
        } catch (e: Exception) {
            Log.w(TAG, "positionCursor failed: ${e.message}")
        }
    }

    private fun moveCursor(dxDp: Float, dyDp: Float) {
        if (cursorView == null) showCursor()
        cursorX += dxDp * density
        cursorY += dyDp * density
        val size = cursorView?.width ?: 0
        cursorX = cursorX.coerceIn(0f, (screenW - size).coerceAtLeast(0).toFloat())
        cursorY = cursorY.coerceIn(0f, (screenH - size).coerceAtLeast(0).toFloat())
        positionCursor()
    }

    // ── Gesture injection ──────────────────────────────────────────────────

    /**
     * Taps at the cursor. [strokes] = 1 → left click; 2 → simultaneous
     * two-finger tap (the standard "right click" mapping on mouse-mode apps).
     */
    private fun dispatchTap(strokes: Int) {
        if (Build.VERSION.SDK_INT < 24) return
        val builder = GestureDescription.Builder()
        for (i in 0 until strokes) {
            val path = Path()
            val offset = if (i == 1) 20 * density else 0f
            path.moveTo(cursorX + offset, cursorY + offset)
            builder.addStroke(GestureDescription.StrokeDescription(path, 0, 80))
        }
        dispatchGesture(builder.build(), null, null)
    }

    /** Drags/swipes at the cursor. Positive [dyDp] = downward swipe. */
    private fun dispatchScroll(dyDp: Float) {
        if (Build.VERSION.SDK_INT < 24) return
        val path = Path()
        path.moveTo(cursorX, cursorY)
        path.lineTo(cursorX, cursorY + dyDp * density)
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 150))
            .build()
        dispatchGesture(gesture, null, null)
    }

    /** The on-screen mouse arrow. Hotspot (where taps land) is the tip at (0, 0). */
    private class CursorView(context: Context, density: Float) : View(context) {
        private val s = density
        private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.FILL
        }
        private val outline = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            style = Paint.Style.STROKE
            strokeWidth = 1.2f * s
        }
        private val arrow = Path().apply {
            moveTo(0f, 0f)                // tip
            lineTo(0f, 26f * s)           // left edge
            lineTo(7f * s, 19f * s)       // notch
            lineTo(14f * s, 26f * s)      // tail
            lineTo(17f * s, 23f * s)
            lineTo(11f * s, 16f * s)
            lineTo(20f * s, 14f * s)      // wing
            close()
        }

        override fun onDraw(canvas: Canvas) {
            canvas.drawPath(arrow, outline)
            canvas.drawPath(arrow, fill)
        }
    }
}
