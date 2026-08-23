package com.kickkey

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.KeyEvent
import android.view.WindowManager
import android.view.accessibility.AccessibilityManager
import android.view.inputmethod.InputConnection
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

class KickKeyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        var activeInputConnection: InputConnection? = null
        var hapticManager: HapticManager? = null
        var banglaEngine: BanglaInputEngine? = null
        var suggestionEngine: SuggestionEngine? = null
        var clipboardHandler: ClipboardHandler? = null

        // Set to true when the keyboard JS calls keyboardReady() after mounting.
        // Used by the IME service's startup watchdog to distinguish "rendering OK"
        // from "surface started but JS never mounted".
        // @Volatile: written on the native-modules thread (ReactMethod) and read
        // on the main thread (IME watchdog) — needs cross-thread visibility.
        @Volatile
        var keyboardJsReady: Boolean = false

        // Captured ReactContext when keyboardReady() is called from JS.
        // In RN 0.86's new architecture, host.currentReactContext can return null
        // even after the host reaches RESUMED state (a known issue in headless/IME
        // contexts). Since keyboardReady() is a @ReactMethod, the ReactContext must
        // exist when it runs — storing it here gives the IME watchdog a reliable
        // fallback to directly resume Fabric's DispatchUIFrameCallback.
        // @Volatile: written on the native-modules thread, read on the main thread.
        @Volatile
        var keyboardReactContext: ReactApplicationContext? = null

        // Set to true when the keyboard JS calls notifyPumpActive() from the mount-
        // pipeline pump (a no-op setInterval that keeps the JS event loop alive so the
        // C++ RuntimeScheduler's updateRendering() drains pending Fabric mount
        // transactions — the fix for the children=0 black keyboard). Surfaced in the
        // watchdog error text (jsPump=active) so a residual failure can distinguish
        // "JS fix not deployed" from "pipeline still blocked downstream".
        // @Volatile: written on the native-modules thread, read on the main thread.
        @Volatile
        var keyboardPumpActive: Boolean = false

        // The most recent onInputStarted parameters. Re-emitted by the IME service after
        // a kickkey_forceRerender remount, because a remount re-creates the JS keyboard
        // subtree and its input-type state (number/phone/password/imeAction) is reset —
        // without this a number field would show the default QWERTY layout after a remount.
        // @Volatile: written/read on the main thread (IME service).
        @Volatile
        var lastInputStartedParams: ReadableMap? = null
    }

    override fun getName(): String = "KickKey"

    // Required by NativeEventEmitter in React Native
    @ReactMethod
    fun addListener(eventType: String) {
        Log.d("KickKeyModule", "addListener: $eventType")
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        Log.d("KickKeyModule", "removeListeners: $count")
    }

    @ReactMethod
    fun keyboardReady(promise: Promise) {
        keyboardJsReady = true
        // Capture the ReactContext while it definitely exists (we're inside a
        // @ReactMethod, so the bridge/context is live). The IME watchdog uses this
        // fallback when host.currentReactContext returns null (RN 0.86 headless bug).
        keyboardReactContext = reactApplicationContext
        Log.i("KickKeyModule", "JS keyboard mounted and ready — React surface is rendering")
        promise.resolve(null)
    }

    @ReactMethod
    fun notifyPumpActive(promise: Promise) {
        keyboardPumpActive = true
        promise.resolve(null)
    }

    @ReactMethod
    fun commitKey(code: String, language: String, promise: Promise) {
        val ic = activeInputConnection
        if (ic != null) {
            if (language == "bn" && code.isNotEmpty()) {
                val banglaResult = banglaEngine?.processKey(code) ?: code
                if (banglaResult.isNotEmpty()) {
                    ic.beginBatchEdit()
                    ic.commitText(banglaResult, 1)
                    ic.endBatchEdit()
                    suggestionEngine?.onCharacterTyped()
                }
            } else if (code.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(code, 1)
                ic.endBatchEdit()
                suggestionEngine?.onCharacterTyped()
            }
            hapticManager?.vibrate()
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun sendBackspace(promise: Promise) {
        val engine = banglaEngine
        val consumedByBuffer = engine?.onBackspace() ?: false
        val deleted: Boolean
        if (consumedByBuffer) {
            // The Bangla phonetic buffer consumed the backspace — something was removed.
            deleted = true
        } else {
            deleted = deleteGraphemeBeforeCursor(activeInputConnection)
            suggestionEngine?.onBackspace()
        }
        // Only give tactile feedback when something was actually deleted — holding
        // backspace on an empty field must not keep buzzing pointlessly.
        if (deleted) hapticManager?.vibrate()
        // Resolve with whether anything was deleted so the JS auto-repeat can stop
        // as soon as the field is empty (stops the pointless repeat + vibration).
        promise.resolve(deleted)
    }

    /**
     * Deletes the full grapheme cluster before the cursor, not a single UTF-16
     * code unit. Emoji are surrogate pairs (2 units) or ZWJ sequences (up to
     * ~11 units) — deleting one unit leaves a lone surrogate that the editor
     * shows as a stray "unicode" character and forces a second backspace to
     * finish the job (the reported emoji deletion bug). ICU BreakIterator
     * (API 24+, below RN 0.86's minSdk of 24) treats ZWJ families like
     * 👨‍👩‍👧‍👦 as ONE cluster, so a single backspace removes the whole emoji,
     * matching Ridmik/Gboard behavior.
     *
     * @return true if a grapheme was actually deleted, false when there is
     *         nothing before the cursor to delete.
     */
    private fun deleteGraphemeBeforeCursor(ic: InputConnection?): Boolean {
        if (ic == null) return false
        val before = ic.getTextBeforeCursor(32, 0)
        if (before == null || before.length == 0) {
            // Nothing before the cursor — nothing to delete.
            return false
        }
        val iterator = android.icu.text.BreakIterator.getCharacterInstance(java.util.Locale.ROOT)
        iterator.setText(before.toString())
        val lastBoundary = iterator.last()
        val clusterStart = iterator.previous()
        if (clusterStart == android.icu.text.BreakIterator.DONE) {
            return false
        }
        val toDelete = lastBoundary - clusterStart
        if (toDelete > 0) {
            ic.deleteSurroundingText(toDelete, 0)
            return true
        }
        return false
    }

    @ReactMethod
    fun commitSpace(promise: Promise) {
        val ic = activeInputConnection
        if (ic != null) {
            val pending = banglaEngine?.flush() ?: ""
            if (pending.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(pending, 1)
                ic.endBatchEdit()
                suggestionEngine?.onCharacterTyped()
            }

            ic.beginBatchEdit()
            val top = suggestionEngine?.getTopSuggestion()
            if (top != null) {
                val currentWord = suggestionEngine!!.getCurrentWord()
                if (currentWord.isNotEmpty() && currentWord != top) {
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
        promise.resolve(null)
    }

    @ReactMethod
    fun commitSuggestion(word: String, promise: Promise) {
        val ic = activeInputConnection
        if (ic != null) {
            val currentWord = suggestionEngine?.getCurrentWord() ?: ""
            ic.beginBatchEdit()
            if (currentWord.isNotEmpty()) {
                ic.deleteSurroundingText(currentWord.length, 0)
            }
            ic.commitText("$word ", 1)
            ic.endBatchEdit()

            suggestionEngine?.onWordCommitted(word)
            hapticManager?.vibrate()
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun commitText(text: String, promise: Promise) {
        val ic = activeInputConnection
        if (ic != null && text.isNotEmpty()) {
            // Flush any pending bangla phonetic buffer first so dictation text
            // never mixes with an uncommitted Roman buffer.
            val pending = banglaEngine?.flush() ?: ""
            ic.beginBatchEdit()
            if (pending.isNotEmpty()) ic.commitText(pending, 1)
            ic.commitText("$text ", 1)
            ic.endBatchEdit()
            suggestionEngine?.onWordCommitted(text)
            hapticManager?.vibrate()
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun flushBanglaBuffer(promise: Promise) {
        val ic = activeInputConnection
        if (ic != null) {
            val pending = banglaEngine?.flush() ?: ""
            if (pending.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(pending, 1)
                ic.endBatchEdit()
            }
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun setBanglaEnabled(enabled: Boolean, promise: Promise) {
        if (!enabled) banglaEngine?.reset()
        promise.resolve(null)
    }

    @ReactMethod
    fun sendEnter(promise: Promise) {
        val ic = activeInputConnection
        if (ic != null) {
            val pending = banglaEngine?.flush() ?: ""
            if (pending.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(pending, 1)
                ic.endBatchEdit()
            }
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_ENTER))

            suggestionEngine?.onWordCommitted(suggestionEngine?.getCurrentWord() ?: "")
            hapticManager?.vibrate()
        }
        promise.resolve(null)
    }

    // ── Touchpad: cursor movement ─────────────────────────────────────────────
    //
    // Called repeatedly while the user drags on the touchpad surface.
    // direction: "left" | "right" | "up" | "down"
    // Each call sends one DPAD key event so JS controls the repeat rate.

    @ReactMethod
    fun moveCursor(direction: String, promise: Promise) {
        val ic = activeInputConnection
        if (ic != null) {
            val keyCode = when (direction) {
                "left"  -> KeyEvent.KEYCODE_DPAD_LEFT
                "right" -> KeyEvent.KEYCODE_DPAD_RIGHT
                "up"    -> KeyEvent.KEYCODE_DPAD_UP
                "down"  -> KeyEvent.KEYCODE_DPAD_DOWN
                else    -> { promise.resolve(null); return }
            }
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   keyCode))
            hapticManager?.vibrate()
        }
        promise.resolve(null)
    }

    // ── Touchpad: scroll ──────────────────────────────────────────────────────
    //
    // direction: "up" | "down"
    // M3: service-first (node scroll / swipe), InputConnection fallback.

    @ReactMethod
    fun scrollPage(direction: String, promise: Promise) {
        val svc = KickKeyAccessibilityService.instance
        Handler(Looper.getMainLooper()).post {
            if (svc != null) {
                svc.scrollAt(direction, PointerOverlay.cursorX, PointerOverlay.cursorY)
            } else {
                val ic = activeInputConnection
                if (ic != null) {
                    val keyCode = if (direction == "up") KeyEvent.KEYCODE_PAGE_UP
                                  else                   KeyEvent.KEYCODE_PAGE_DOWN
                    ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
                    ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   keyCode))
                    hapticManager?.vibrate()
                }
            }
            promise.resolve(null)
        }
    }

    // ── Touchpad: nav backward / forward ─────────────────────────────────────
    //
    // direction: "backward" | "forward"
    // M3: service-first (GLOBAL_ACTION_BACK / scroll-forward), DPAD fallback.
    // Now resolves Boolean: true = handled, false = unsupported.

    @ReactMethod
    fun navigateHistory(direction: String, promise: Promise) {
        val svc = KickKeyAccessibilityService.instance
        Handler(Looper.getMainLooper()).post {
            if (direction == "backward") {
                val handled = if (svc != null) {
                    svc.navigateBack()
                } else {
                    // Fallback: ALT + DPAD_LEFT (word-left / history-back).
                    val ic = activeInputConnection
                    if (ic != null) {
                        val metaState = KeyEvent.META_ALT_ON
                        ic.sendKeyEvent(KeyEvent(0L, 0L, KeyEvent.ACTION_DOWN,
                            KeyEvent.KEYCODE_DPAD_LEFT, 0, metaState))
                        ic.sendKeyEvent(KeyEvent(0L, 0L, KeyEvent.ACTION_UP,
                            KeyEvent.KEYCODE_DPAD_LEFT, 0, metaState))
                        hapticManager?.vibrate()
                    }
                    true
                }
                promise.resolve(handled)
            } else {
                // Forward: no GLOBAL_ACTION_FORWARD and a11y cannot inject keys.
                // Best effort = scroll-forward on the focused node; JS shows a
                // subtle hint when this resolves false. (Pro mode = M4.)
                promise.resolve(svc?.scrollForwardOnNode() ?: false)
            }
        }
    }

    // ── Touchpad: mouse L / R buttons ─────────────────────────────────────────
    //
    // button: "left" | "right"
    // M3: service-first (tapAt / longPressAt at cursor), InputConnection fallback.

    @ReactMethod
    fun mouseClick(button: String, promise: Promise) {
        val svc = KickKeyAccessibilityService.instance
        Handler(Looper.getMainLooper()).post {
            if (svc != null) {
                // Cross-app path: inject a real tap / long-press under the cursor.
                if (button == "left") {
                    svc.tapAt(PointerOverlay.cursorX, PointerOverlay.cursorY)
                } else {
                    svc.longPressAt(PointerOverlay.cursorX, PointerOverlay.cursorY)
                }
                hapticManager?.vibrate()
            } else {
                // Fallback: a11y disabled → previous text-field behavior.
                val ic = activeInputConnection
                if (ic != null) {
                    if (button == "left") {
                        ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DPAD_CENTER))
                        ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_DPAD_CENTER))
                    } else {
                        ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MENU))
                        ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_MENU))
                    }
                    hapticManager?.vibrate()
                }
            }
            promise.resolve(null)
        }
    }

    // ── Touchpad: on-screen mouse pointer overlay (M2 — RN cursor) ──────────
    //
    // The cursor is now a React Native surface ("KickKeyPointer") managed by
    // the PointerOverlay singleton in its own overlay window (a11y overlay
    // first, app-overlay fallback). Native owns the position; the RN arrow
    // never re-renders while moving.
    //
    // All PointerOverlay calls run on the main thread (same pattern as before).

    @ReactMethod
    fun pointerShow(promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            val ok = PointerOverlay.show(reactApplicationContext)
            promise.resolve(ok)
        }
    }

    @ReactMethod
    fun pointerMove(dx: Double, dy: Double, promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            PointerOverlay.move(dx.toFloat(), dy.toFloat())
            KickKeyAccessibilityService.instance?.onDragDelta(dx.toFloat(), dy.toFloat())
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun pointerHide(promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            PointerOverlay.hide()
            promise.resolve(null)
        }
    }

    /**
     * Called by JS (QykeyKeyboard via measureInWindow on mainKeysContainer) to
     * give the overlay the exact screen Y of the top of the main key area.
     * This ensures the red overlay height stops at the main keys, not the toggle row.
     * [yPx] is already in physical pixels (measureInWindow returns px on Android).
     */
    @ReactMethod
    fun pointerSetOverlayTopY(yPx: Double, promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            PointerOverlay.overlayTopYOverride = yPx.toInt().coerceAtLeast(0)
            // Re-snap the overlay height if it's already visible
            PointerOverlay.updateOverlayBounds()
            promise.resolve(null)
        }
    }

    // ── Touchpad: IME strip mode + drag (M3) ───────────────────────────────

    /** Shrinks the IME window to a thin strip while the touchpad tab is active. */
    @ReactMethod
    fun setTouchpadMode(on: Boolean, promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            KickKeyInputMethodService.instance?.setTouchpadStripMode(on)
            promise.resolve(null)
        }
    }

    /** L button pressed — arm a drag at the cursor's current position. */
    @ReactMethod
    fun dragStart(promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            KickKeyAccessibilityService.instance?.beginDrag()
            promise.resolve(null)
        }
    }

    /** L button released — dispatch a drag stroke, or a tap if nothing moved. */
    @ReactMethod
    fun dragEnd(promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            KickKeyAccessibilityService.instance?.endDrag()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun isOverlayGranted(promise: Promise) {
        val context = reactApplicationContext
        promise.resolve(Settings.canDrawOverlays(context))
    }

    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.w("KickKeyModule", "openOverlaySettings failed: ${e.message}")
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun getClipboardHistory(promise: Promise) {
        val history = clipboardHandler?.getHistory() ?: emptyList()
        val array = Arguments.createArray()
        history.forEach { array.pushString(it) }
        promise.resolve(array)
    }

    @ReactMethod
    fun clearClipboardHistory(promise: Promise) {
        clipboardHandler?.clearHistory()
        promise.resolve(null)
    }

    @ReactMethod
    fun removeClipboardItem(text: String, promise: Promise) {
        clipboardHandler?.removeItem(text)
        promise.resolve(null)
    }

    @ReactMethod
    fun getRecentEmojis(promise: Promise) {
        val list = clipboardHandler?.getRecentEmojis() ?: emptyList()
        val array = Arguments.createArray()
        list.forEach { array.pushString(it) }
        promise.resolve(array)
    }

    @ReactMethod
    fun recordEmojiUsed(emoji: String, promise: Promise) {
        clipboardHandler?.recordEmojiUsed(emoji)
        promise.resolve(null)
    }

    @ReactMethod
    fun playKeySound(promise: Promise) {
        val context = reactApplicationContext
        val soundEnabled = context
            .getSharedPreferences("kickkey_prefs", Context.MODE_PRIVATE)
            .getBoolean("soundEnabled", false)
        if (soundEnabled) {
            try {
                val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                am.playSoundEffect(AudioManager.FX_KEYPRESS_STANDARD, -1f)
            } catch (e: Exception) {
                Log.w("KickKeyModule", "Sound effect failed: ${e.message}")
            }
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun setDictionaryWords(words: ReadableArray, promise: Promise) {
        val context = reactApplicationContext
        val list = mutableListOf<String>()
        for (i in 0 until words.size()) {
            words.getString(i)?.let { list.add(it) }
        }
        val serialized = list.joinToString("\n")
        context.getSharedPreferences("kickkey_dictionary", Context.MODE_PRIVATE)
            .edit()
            .putString("custom_words", serialized)
            .apply()
        promise.resolve(null)
    }

    @ReactMethod
    fun getDictionaryWords(promise: Promise) {
        val context = reactApplicationContext
        val raw = context.getSharedPreferences("kickkey_dictionary", Context.MODE_PRIVATE)
            .getString("custom_words", "") ?: ""
        val array = Arguments.createArray()
        if (raw.isNotEmpty()) {
            raw.split("\n").forEach { array.pushString(it) }
        }
        promise.resolve(array)
    }

    @ReactMethod
    fun removeDictionaryWord(word: String, promise: Promise) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("kickkey_dictionary", Context.MODE_PRIVATE)
        val raw = prefs.getString("custom_words", "") ?: ""
        val updated = raw.split("\n").filter { it != word && it.isNotBlank() }
        prefs.edit().putString("custom_words", updated.joinToString("\n")).apply()
        promise.resolve(null)
    }

    @ReactMethod
    fun getPreferences(promise: Promise) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("kickkey_prefs", Context.MODE_PRIVATE)
        val map = Arguments.createMap().apply {
            putString("language",        prefs.getString("language",        "en")      ?: "en")
            putString("theme",           prefs.getString("theme",           "dark")    ?: "dark")
            putString("keyboardBg",      prefs.getString("keyboardBg",      "#0d0d1a") ?: "#0d0d1a")
            putString("themeKeyBg",      prefs.getString("themeKeyBg",      "#1e1e2e") ?: "#1e1e2e")
            putString("themeKeyText",    prefs.getString("themeKeyText",    "#ffffff") ?: "#ffffff")
            putString("specialKeyBg",    prefs.getString("specialKeyBg",   "#2a2a40") ?: "#2a2a40")
            putString("themePrimary",    prefs.getString("themePrimary",   "#8594aa") ?: "#8594aa")
            putInt("keyHeight",          prefs.getInt("keyHeight",        48))
            putInt("keyBorderRadius",     prefs.getInt("keyBorderRadius",   6))
            putInt("fontSize",          prefs.getInt("fontSize",          16))
            putInt("keyMargin",          prefs.getInt("keyMargin",          3))
            putBoolean("hapticEnabled",   prefs.getBoolean("hapticEnabled",  true))
            putBoolean("soundEnabled",    prefs.getBoolean("soundEnabled",   false))
            putBoolean("autoCorrect",     prefs.getBoolean("autoCorrect",    true))
            putBoolean("showSuggestions", prefs.getBoolean("showSuggestions",true))
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun savePreferences(prefMap: ReadableMap, promise: Promise) {
        val context = reactApplicationContext
        val editor = context
            .getSharedPreferences("kickkey_prefs", Context.MODE_PRIVATE)
            .edit()

        val entryIterator = prefMap.entryIterator
        while (entryIterator.hasNext()) {
            val entry = entryIterator.next()
            val key = entry.key
            when (val value = entry.value) {
                is String  -> editor.putString(key, value)
                is Boolean -> editor.putBoolean(key, value)
                is Double  -> editor.putInt(key, value.toInt())
                is Int     -> editor.putInt(key, value)
            }
        }
        editor.apply()
        promise.resolve(null)
    }

    @ReactMethod
    fun isDefaultKeyboard(promise: Promise) {
        val context = reactApplicationContext
        val current = android.provider.Settings.Secure.getString(
            context.contentResolver,
            android.provider.Settings.Secure.DEFAULT_INPUT_METHOD
        )
        promise.resolve(current?.contains(context.packageName) ?: false)
    }

    @ReactMethod
    fun isKeyboardEnabled(promise: Promise) {
        val context = reactApplicationContext
        val enabled = android.provider.Settings.Secure.getString(
            context.contentResolver,
            android.provider.Settings.Secure.ENABLED_INPUT_METHODS
        ) ?: ""
        promise.resolve(enabled.contains(context.packageName))
    }

    @ReactMethod
    fun openKeyboardSettings(promise: Promise) {
        val context = reactApplicationContext
        val intent = android.content.Intent(
            android.provider.Settings.ACTION_INPUT_METHOD_SETTINGS
        ).apply { flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK }
        context.startActivity(intent)
        promise.resolve(null)
    }

    @ReactMethod
    fun showInputMethodPicker(promise: Promise) {
        // Show the system "Choose input method" picker so the user can select
        // KickKey as the current (default) keyboard. This is the standard
        // "set as default" flow (used by Gboard) and works on every Android
        // version/device, unlike Settings.ACTION_INPUT_METHOD_SETTINGS which
        // on Android 12+ only opens the "Available on-screen keyboards" list.
        val context = reactApplicationContext
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE)
                as android.view.inputmethod.InputMethodManager
        imm.showInputMethodPicker()
        promise.resolve(null)
    }

    // ── Accessibility service (M1) ──────────────────────────────────────────

    /**
     * Resolves true when KickKeyAccessibilityService is enabled in the system
     * accessibility settings. Works from any process (reads AccessibilityManager +
     * Settings.Secure fallback; the a11y service singleton itself only exists in :ime_process).
     */
    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        val context = reactApplicationContext
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

        // Fallback via Settings.Secure (mirrors isKeyboardEnabled check)
        val enabledViaSecure = if (!enabledViaManager) {
            val raw = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            raw.contains("KickKeyAccessibilityService")
        } else false

        promise.resolve(enabledViaManager || enabledViaSecure)
    }

    /** Deep-links to the system accessibility settings so the user can enable KickKey. */
    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            Log.w("KickKeyModule", "openAccessibilitySettings failed: ${e.message}")
        }
        promise.resolve(null)
    }

    /**
     * Shows the floating KickKey panel. Only meaningful in :ime_process (where the
     * a11y service singleton lives); resolves without error elsewhere.
     */
    @ReactMethod
    fun showFloatingPanel(promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            KickKeyAccessibilityService.instance?.showFloatingPanel()
        }
        promise.resolve(null)
    }

    /** Hides the floating KickKey panel (used by the panel's own close button). */
    @ReactMethod
    fun hideFloatingPanel(promise: Promise) {
        Handler(Looper.getMainLooper()).post {
            KickKeyAccessibilityService.instance?.hideFloatingPanel()
        }
        promise.resolve(null)
    }
}
