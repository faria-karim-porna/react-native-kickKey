package com.kickkey

import android.content.Context
import android.view.KeyEvent
import android.view.inputmethod.InputConnection
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KickKeyModule : Module() {

    companion object {
        var activeInputConnection: InputConnection? = null
        var hapticManager: HapticManager? = null

        // ── NEW in Phase 3 ────────────────────────────────────────────────
        var banglaEngine: BanglaInputEngine? = null
    }

    override fun definition() = ModuleDefinition {
        Name("KickKey")

        // ── UPDATED: commitKey now routes through Bangla engine ───────────

        Function("commitKey") { code: String, language: String ->
            val ic = activeInputConnection ?: return@Function

            if (language == "bn" && code.isNotEmpty()) {
                // Route through Bangla phonetic engine
                val banglaResult = banglaEngine?.processKey(code) ?: code
                if (banglaResult.isNotEmpty()) {
                    ic.beginBatchEdit()
                    ic.commitText(banglaResult, 1)
                    ic.endBatchEdit()
                }
                // If banglaResult is empty, the engine is buffering
            } else if (code.isNotEmpty()) {
                // English — commit directly
                ic.beginBatchEdit()
                ic.commitText(code, 1)
                ic.endBatchEdit()
            }

            hapticManager?.vibrate()
        }

        // ── UPDATED: sendBackspace checks Bangla buffer first ─────────────

        Function("sendBackspace") {
            val engine = banglaEngine
            val consumedByBuffer = engine?.onBackspace() ?: false
            if (!consumedByBuffer) {
                activeInputConnection?.deleteSurroundingText(1, 0)
            }
            hapticManager?.vibrate()
        }

        // ── UPDATED: commitSpace flushes the Bangla buffer first ─────────

        Function("commitSpace") {
            val ic = activeInputConnection ?: return@Function
            val pending = banglaEngine?.flush() ?: ""
            if (pending.isNotEmpty()) {
                ic.beginBatchEdit()
                ic.commitText(pending, 1)
                ic.endBatchEdit()
            }
            ic.beginBatchEdit()
            ic.commitText(" ", 1)
            ic.endBatchEdit()
            hapticManager?.vibrate()
        }

        // ── NEW: flush the Bangla buffer explicitly ───────────────────────

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
            hapticManager?.vibrate()
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
    }
}
