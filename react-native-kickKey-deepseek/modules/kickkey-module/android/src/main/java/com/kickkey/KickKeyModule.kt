package com.kickkey

import android.content.Context
import android.view.KeyEvent
import android.view.inputmethod.InputConnection
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KickKeyModule : Module() {

    companion object {
        /**
         * Set by KickKeyInputMethodService.onStartInputView().
         * Cleared by onFinishInput().
         * All commitKey / sendBackspace calls use this reference.
         */
        var activeInputConnection: InputConnection? = null

        /**
         * Holds a reference to HapticManager so commitKey can trigger vibration.
         * Set by KickKeyInputMethodService.onCreate().
         */
        var hapticManager: HapticManager? = null
    }

    override fun definition() = ModuleDefinition {
        Name("KickKey")

        // ── Core text input ──────────────────────────────────────────────────

        /**
         * Commits a single character to the focused text field.
         * For Phase 2 English only — Bangla routing added in Phase 3.
         *
         * Called from useKeyboardState.handleKeyPress() in TypeScript.
         */
        Function("commitKey") { code: String, _language: String ->
            val ic = activeInputConnection ?: return@Function
            if (code.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(code, 1)
                ic.endBatchEdit()
            }
            hapticManager?.vibrate()
        }

        /**
         * Deletes the character immediately before the cursor.
         * Equivalent to pressing the physical Backspace key.
         */
        Function("sendBackspace") {
            activeInputConnection?.deleteSurroundingText(1, 0)
            hapticManager?.vibrate()
        }

        /**
         * Commits a space character.
         * Phase 4 will upgrade this to auto-commit the top suggestion.
         */
        Function("commitSpace") {
            activeInputConnection?.commitText(" ", 1)
            hapticManager?.vibrate()
        }

        /**
         * Sends an Enter key event to the focused field.
         * Works across all apps (chat, forms, search bars).
         */
        Function("sendEnter") {
            val ic = activeInputConnection ?: return@Function
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_ENTER))
            hapticManager?.vibrate()
        }

        // ── Preferences ──────────────────────────────────────────────────────

        /**
         * Returns the current keyboard preferences from SharedPreferences.
         * Called by useKeyboardTheme.ts on mount to set colors and dimensions.
         */
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

        /**
         * Writes preferences set by the companion app (Phase 5).
         * The keyboard reads these on next open via getPreferences().
         */
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

        // ── Phase 4+ stubs (do not implement yet) ────────────────────────────
        // commitSuggestion, getClipboardHistory
    }
}
