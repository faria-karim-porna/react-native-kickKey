package com.kickkey

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.view.inputmethod.InputConnection
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class KickKeyModule : Module() {

    companion object {
        var activeInputConnection: InputConnection? = null
        var hapticManager: HapticManager? = null
        var banglaEngine: BanglaInputEngine? = null

        // ── NEW in Phase 4 ────────────────────────────────────────────────
        var suggestionEngine: SuggestionEngine? = null

        // ── NEW in Phase 6 ────────────────────────────────────────────────
        var clipboardHandler: ClipboardHandler? = null
    }

    // ── Touchpad: on-screen mouse pointer overlay ────────────────────────────
    // A desktop-style cursor drawn over the app screen (TYPE_APPLICATION_OVERLAY).
    // Moved with RELATIVE deltas like a laptop trackpad; clamped to the visible
    // app area (below the status bar, above the keyboard).
    private var pointerView: View? = null
    private var pointerX = 0f
    private var pointerY = 0f

    private fun pointerSizePx(): Int {
        val ctx = appContext.reactContext ?: return 0
        return (28 * ctx.resources.displayMetrics.density).toInt()
    }

    private fun pointerMarginPx(): Int {
        val ctx = appContext.reactContext ?: return 0
        return (4 * ctx.resources.displayMetrics.density).toInt()
    }

    private fun screenWidthPx(): Int {
        val ctx = appContext.reactContext ?: return 0
        return ctx.resources.displayMetrics.widthPixels
    }

    private fun screenHeightPx(): Int {
        val ctx = appContext.reactContext ?: return 0
        return ctx.resources.displayMetrics.heightPixels
    }

    private fun statusBarHeightPx(context: Context): Int {
        val res = context.resources
        val id = res.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) res.getDimensionPixelSize(id) else 0
    }

    private fun createPointerBitmap(size: Int): Bitmap {
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val s = size.toFloat()
        // Classic desktop arrow: tip top-left, tail bottom-right
        val path = Path().apply {
            moveTo(0.16f * s, 0.10f * s)
            lineTo(0.16f * s, 0.66f * s)
            lineTo(0.32f * s, 0.52f * s)
            lineTo(0.45f * s, 0.80f * s)
            lineTo(0.57f * s, 0.72f * s)
            lineTo(0.45f * s, 0.46f * s)
            lineTo(0.68f * s, 0.45f * s)
            close()
        }
        val shadow = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0x66000000.toInt()
            setShadowLayer(1.5f, 1.5f, 2f, 0x66000000.toInt())
        }
        val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
        val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            style = Paint.Style.STROKE
            strokeWidth = 1.5f
        }
        canvas.drawPath(path, shadow)
        canvas.drawPath(path, fill)
        canvas.drawPath(path, stroke)
        return bmp
    }

    override fun definition() = ModuleDefinition {
        Name("KickKey")

        // ── UPDATED: commitKey notifies suggestion engine ─────────────────

        Function("commitKey") { code: String, language: String ->
            val ic = activeInputConnection ?: return@Function

            if (language == "bn" && code.isNotEmpty()) {
                // Route through Bangla phonetic engine
                val banglaResult = banglaEngine?.processKey(code) ?: code
                if (banglaResult.isNotEmpty()) {
                    ic.beginBatchEdit()
                    ic.commitText(banglaResult, 1)
                    ic.endBatchEdit()
                    suggestionEngine?.onCharacterTyped()   // ← NEW
                }
            } else if (code.isNotEmpty()) {
                // English — commit directly
                ic.beginBatchEdit()
                ic.commitText(code, 1)
                ic.endBatchEdit()
                suggestionEngine?.onCharacterTyped()       // ← NEW
            }

            hapticManager?.vibrate()
        }

        // ── UPDATED: sendBackspace notifies suggestion engine ─────────────

        Function("sendBackspace") {
            val engine = banglaEngine
            val consumedByBuffer = engine?.onBackspace() ?: false
            if (!consumedByBuffer) {
                activeInputConnection?.deleteSurroundingText(1, 0)
                suggestionEngine?.onBackspace()    // notify after actual delete
            }
            // When Bangla buffer consumed the backspace, no text was deleted
            // from InputConnection, so skip suggestion recomputation
            hapticManager?.vibrate()
        }

        // ── UPDATED: commitSpace auto-corrects with top suggestion ────────

        Function("commitSpace") {
            val ic = activeInputConnection ?: return@Function

            // Flush Bangla buffer first (Phase 3)
            val pending = banglaEngine?.flush() ?: ""
            if (pending.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(pending, 1)
                ic.endBatchEdit()
                suggestionEngine?.onCharacterTyped()
            }

            ic.beginBatchEdit()

            // Phase 4: auto-correct with top suggestion if available
            val top = suggestionEngine?.getTopSuggestion()
            if (top != null) {
                val currentWord = suggestionEngine!!.getCurrentWord()
                if (currentWord.isNotEmpty() && currentWord != top) {
                    // Replace current partial word with the suggestion
                    ic.deleteSurroundingText(currentWord.length, 0)
                    ic.commitText("$top ", 1)
                    suggestionEngine?.onWordCommitted(top)
                } else {
                    ic.commitText(" ", 1)
                }
            } else {
                ic.commitText(" ", 1)
            }

            ic.endBatchEdit()
            hapticManager?.vibrate()
        }

        // ── NEW: commitSuggestion — user tapped a chip ─────────────────────

        Function("commitSuggestion") { word: String ->
            val ic = activeInputConnection ?: return@Function
            val currentWord = suggestionEngine?.getCurrentWord() ?: ""

            ic.beginBatchEdit()

            // Delete the partially typed word
            if (currentWord.isNotEmpty()) {
                ic.deleteSurroundingText(currentWord.length, 0)
            }
            // Commit the chosen suggestion + trailing space
            ic.commitText("$word ", 1)

            ic.endBatchEdit()

            // Record in user model; clear suggestions
            suggestionEngine?.onWordCommitted(word)
            hapticManager?.vibrate()
        }

        // ── Phase 3: flush the Bangla buffer ──────────────────────────────

        Function("flushBanglaBuffer") {
            val ic = activeInputConnection ?: return@Function
            val pending = banglaEngine?.flush() ?: ""
            if (pending.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(pending, 1)
                ic.endBatchEdit()
            }
        }

        Function("setBanglaEnabled") { enabled: Boolean ->
            if (!enabled) banglaEngine?.reset()
        }

        // ── UPDATED: sendEnter flushes Bangla buffer first ────────────────

        Function("sendEnter") {
            val ic = activeInputConnection ?: return@Function
            val pending = banglaEngine?.flush() ?: ""
            if (pending.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(pending, 1)
                ic.endBatchEdit()
            }
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_ENTER))

            // Clear suggestions on new line
            suggestionEngine?.onWordCommitted(suggestionEngine?.getCurrentWord() ?: "")
            hapticManager?.vibrate()
        }

        // ── Touchpad: cursor movement ─────────────────────────────────────────
        //
        // Called repeatedly while the user drags on the touchpad surface.
        // direction: "left" | "right" | "up" | "down"
        // Each call sends one DPAD key event; JS controls the repeat rate.

        Function("moveCursor") { direction: String ->
            val ic = activeInputConnection ?: return@Function
            val keyCode = when (direction) {
                "left"  -> KeyEvent.KEYCODE_DPAD_LEFT
                "right" -> KeyEvent.KEYCODE_DPAD_RIGHT
                "up"    -> KeyEvent.KEYCODE_DPAD_UP
                "down"  -> KeyEvent.KEYCODE_DPAD_DOWN
                else    -> return@Function
            }
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   keyCode))
            hapticManager?.vibrate()
        }

        // ── Touchpad: scroll ─────────────────────────────────────────────────
        //
        // direction: "up" | "down"
        // Sends PAGE_UP / PAGE_DOWN key events to the focused input connection.

        Function("scrollPage") { direction: String ->
            val ic = activeInputConnection ?: return@Function
            val keyCode = if (direction == "up") KeyEvent.KEYCODE_PAGE_UP
                          else                   KeyEvent.KEYCODE_PAGE_DOWN
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   keyCode))
            hapticManager?.vibrate()
        }

        // ── Touchpad: nav backward / forward ─────────────────────────────────
        //
        // direction: "backward" | "forward"
        // ALT + DPAD_LEFT = word-left / history-back
        // ALT + DPAD_RIGHT = word-right / history-forward

        Function("navigateHistory") { direction: String ->
            val ic = activeInputConnection ?: return@Function
            val keyCode = if (direction == "backward") KeyEvent.KEYCODE_DPAD_LEFT
                          else                         KeyEvent.KEYCODE_DPAD_RIGHT
            val metaState = KeyEvent.META_ALT_ON
            ic.sendKeyEvent(KeyEvent(0L, 0L, KeyEvent.ACTION_DOWN, keyCode, 0, metaState))
            ic.sendKeyEvent(KeyEvent(0L, 0L, KeyEvent.ACTION_UP,   keyCode, 0, metaState))
            hapticManager?.vibrate()
        }

        // ── Touchpad: mouse L / R buttons ────────────────────────────────────
        //
        // button: "left" | "right"
        // Left  = DPAD_CENTER (tap / confirm at cursor, best IME approximation)
        // Right = KEYCODE_MENU (open context menu of the focused view)

        Function("mouseClick") { button: String ->
            val ic = activeInputConnection ?: return@Function
            if (button == "left") {
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DPAD_CENTER))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_DPAD_CENTER))
            } else {
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MENU))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_MENU))
            }
            hapticManager?.vibrate()
        }

        // ── Touchpad: on-screen mouse pointer overlay ────────────────────────
        //
        // A desktop-style cursor drawn over the app screen (TYPE_APPLICATION_OVERLAY).
        // Moved with RELATIVE deltas like a laptop trackpad; clamped to the visible
        // app area (below the status bar, above the keyboard). Requires "Display over
        // other apps" (SYSTEM_ALERT_WINDOW) — if not granted, pointerShow() returns
        // false and the touchpad still works for caret movement / scroll / clicks.

        Function("pointerShow") {
            val context = appContext.reactContext ?: return@Function false
            if (!Settings.canDrawOverlays(context)) return@Function false
            withContext(Dispatchers.Main) {
                try {
                    if (pointerView == null) {
                        val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                        val size = pointerSizePx()
                        val view = android.widget.ImageView(context).apply {
                            setImageBitmap(createPointerBitmap(size))
                        }
                        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                        } else {
                            @Suppress("DEPRECATION")
                            WindowManager.LayoutParams.TYPE_PHONE
                        }
                        val minY = statusBarHeightPx(context) + pointerMarginPx()
                        // Keep the pointer above the keyboard window (275dp, matching
                        // KEYBOARD_HEIGHT_DP in KickKeyInputMethodService).
                        val keyboardH = (275 * context.resources.displayMetrics.density).toInt()
                        val maxY = (screenHeightPx() - keyboardH - size - pointerMarginPx())
                            .coerceAtLeast(minY)
                        val params = WindowManager.LayoutParams(
                            size,
                            size,
                            type,
                            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                            PixelFormat.TRANSLUCENT
                        ).apply {
                            gravity = Gravity.TOP or Gravity.START
                            x = (screenWidthPx() - size) / 2
                            y = (minY + maxY) / 2
                        }
                        pointerX = params.x.toFloat()
                        pointerY = params.y.toFloat()
                        wm.addView(view, params)
                        pointerView = view
                    }
                    true
                } catch (e: Exception) {
                    android.util.Log.w("KickKeyModule", "pointerShow failed: ${e.message}")
                    false
                }
            }
        }

        Function("pointerMove") { dx: Double, dy: Double ->
            withContext(Dispatchers.Main) {
                val view = pointerView
                if (view == null) return@withContext
                try {
                    val context = appContext.reactContext ?: return@withContext
                    val size = pointerSizePx()
                    val minY = statusBarHeightPx(context) + pointerMarginPx()
                    val keyboardH = (275 * context.resources.displayMetrics.density).toInt()
                    val maxY = (screenHeightPx() - keyboardH - size - pointerMarginPx())
                        .coerceAtLeast(minY)
                    pointerX = (pointerX + dx.toFloat()).coerceIn(0f, (screenWidthPx() - size).coerceAtLeast(0).toFloat())
                    pointerY = (pointerY + dy.toFloat()).coerceIn(minY.toFloat(), maxY.toFloat())
                    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                    val params = view.layoutParams as WindowManager.LayoutParams
                    params.x = pointerX.toInt()
                    params.y = pointerY.toInt()
                    wm.updateViewLayout(view, params)
                } catch (e: Exception) {
                    android.util.Log.w("KickKeyModule", "pointerMove failed: ${e.message}")
                }
            }
        }

        Function("pointerHide") {
            withContext(Dispatchers.Main) {
                val view = pointerView ?: return@withContext
                try {
                    val context = appContext.reactContext ?: return@withContext
                    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                    wm.removeView(view)
                } catch (e: Exception) {
                    android.util.Log.w("KickKeyModule", "pointerHide failed: ${e.message}")
                }
                pointerView = null
            }
        }

        Function("openOverlaySettings") {
            val context = appContext.reactContext ?: return@Function
            try {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${context.packageName}")
                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            } catch (e: Exception) {
                android.util.Log.w("KickKeyModule", "openOverlaySettings failed: ${e.message}")
            }
        }

        // ── Phase 6: Clipboard ──────────────────────────────────────────────────

        Function("getClipboardHistory") {
            clipboardHandler?.getHistory() ?: emptyList<String>()
        }

        Function("clearClipboardHistory") {
            clipboardHandler?.clearHistory()
        }

        Function("removeClipboardItem") { text: String ->
            clipboardHandler?.removeItem(text)
        }

        // ── Phase 6: Recent emojis ──────────────────────────────────────────────

        Function("getRecentEmojis") {
            clipboardHandler?.getRecentEmojis() ?: emptyList<String>()
        }

        Function("recordEmojiUsed") { emoji: String ->
            clipboardHandler?.recordEmojiUsed(emoji)
        }

        // ── Phase 7: Sound feedback ────────────────────────────────────────────────

        Function("playKeySound") {
            val context = appContext.reactContext ?: return@Function
            val soundEnabled = context
                .getSharedPreferences("kickkey_prefs", Context.MODE_PRIVATE)
                .getBoolean("soundEnabled", false)
            if (!soundEnabled) return@Function
            try {
                val am = context.getSystemService(android.content.Context.AUDIO_SERVICE)
                        as android.media.AudioManager
                am.playSoundEffect(android.media.AudioManager.FX_KEYPRESS_STANDARD, -1f)
            } catch (e: Exception) {
                android.util.Log.w("KickKeyModule", "Sound effect failed: ${e.message}")
            }
        }

        // ── Phase 5: Custom dictionary management ──────────────────────────────

        Function("setDictionaryWords") { words: List<String> ->
            val context = appContext.reactContext ?: return@Function
            val serialized = words.joinToString("\n")
            context.getSharedPreferences("kickkey_dictionary", Context.MODE_PRIVATE)
                .edit()
                .putString("custom_words", serialized)
                .apply()
        }

        Function("getDictionaryWords") {
            val context = appContext.reactContext ?: return@Function emptyList<String>()
            val raw = context.getSharedPreferences("kickkey_dictionary", Context.MODE_PRIVATE)
                .getString("custom_words", "") ?: ""
            if (raw.isEmpty()) emptyList() else raw.split("\n")
        }

        Function("removeDictionaryWord") { word: String ->
            val context = appContext.reactContext ?: return@Function
            val prefs = context.getSharedPreferences("kickkey_dictionary", Context.MODE_PRIVATE)
            val raw = prefs.getString("custom_words", "") ?: ""
            val updated = raw.split("\n").filter { it != word && it.isNotBlank() }
            prefs.edit().putString("custom_words", updated.joinToString("\n")).apply()
        }

        // ── Preferences ──────────────────────────────────────────────────────

        Function("getPreferences") {
            val context = appContext.reactContext ?: return@Function emptyMap<String, Any>()
            val prefs = context.getSharedPreferences("kickkey_prefs", Context.MODE_PRIVATE)
            mapOf(
                "language"        to (prefs.getString("language",        "en")      ?: "en"),
                "theme"           to (prefs.getString("theme",           "dark")    ?: "dark"),
                "keyboardBg"      to (prefs.getString("keyboardBg",      "#0d0d1a") ?: "#0d0d1a"),
                "themeKeyBg"      to (prefs.getString("themeKeyBg",      "#1e1e2e") ?: "#1e1e2e"),
                "themeKeyText"    to (prefs.getString("themeKeyText",    "#ffffff") ?: "#ffffff"),
                "specialKeyBg"    to (prefs.getString("specialKeyBg",   "#2a2a40") ?: "#2a2a40"),
                "themePrimary"    to (prefs.getString("themePrimary",   "#00BCD4") ?: "#00BCD4"),
                "keyHeight"       to prefs.getInt("keyHeight",        48),
                "keyBorderRadius" to prefs.getInt("keyBorderRadius",   6),
                "fontSize"        to prefs.getInt("fontSize",          16),
                "keyMargin"       to prefs.getInt("keyMargin",          3),
                "hapticEnabled"   to prefs.getBoolean("hapticEnabled",  true),
                "soundEnabled"    to prefs.getBoolean("soundEnabled",   false),
                "autoCorrect"     to prefs.getBoolean("autoCorrect",    true),
                "showSuggestions" to prefs.getBoolean("showSuggestions",true)
            )
        }

        Function("savePreferences") { prefMap: Map<String, Any> ->
            val context = appContext.reactContext ?: return@Function
            val editor = context
                .getSharedPreferences("kickkey_prefs", Context.MODE_PRIVATE)
                .edit()
            prefMap.forEach { (key, value) ->
                when (value) {
                    is String  -> editor.putString(key, value)
                    is Boolean -> editor.putBoolean(key, value)
                    is Int     -> editor.putInt(key, value)
                    is Double  -> editor.putFloat(key, value.toFloat())
                }
            }
            editor.apply()
        }

        // ── IME status (carried over from Phase 1) ────────────────────────────

        Function("isDefaultKeyboard") {
            val context = appContext.reactContext ?: return@Function false
            val current = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.DEFAULT_INPUT_METHOD
            )
            current?.contains(context.packageName) ?: false
        }

        Function("isKeyboardEnabled") {
            val context = appContext.reactContext ?: return@Function false
            val enabled = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ENABLED_INPUT_METHODS
            ) ?: ""
            enabled.contains(context.packageName)
        }

        Function("openKeyboardSettings") {
            val context = appContext.reactContext ?: return@Function
            val intent = android.content.Intent(
                android.provider.Settings.ACTION_INPUT_METHOD_SETTINGS
            ).apply { flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK }
            context.startActivity(intent)
        }

        // Show the system "Choose input method" picker so the user can select
        // KickKey as the current (default) keyboard. Works on every Android
        // version/device, unlike Settings.ACTION_INPUT_METHOD_SETTINGS which
        // on Android 12+ only opens the "Available on-screen keyboards" list.
        Function("showInputMethodPicker") {
            val context = appContext.reactContext ?: return@Function
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE)
                    as android.view.inputmethod.InputMethodManager
            imm.showInputMethodPicker()
        }
    }
}
