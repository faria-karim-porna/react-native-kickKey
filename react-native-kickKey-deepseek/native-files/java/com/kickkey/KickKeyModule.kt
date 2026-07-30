package com.kickkey

import android.content.Context
import android.media.AudioManager
import android.util.Log
import android.view.KeyEvent
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
        if (!consumedByBuffer) {
            activeInputConnection?.deleteSurroundingText(1, 0)
            suggestionEngine?.onBackspace()
        }
        hapticManager?.vibrate()
        promise.resolve(null)
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
            putString("themePrimary",    prefs.getString("themePrimary",   "#00BCD4") ?: "#00BCD4")
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
}
