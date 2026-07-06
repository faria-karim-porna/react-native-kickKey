package com.kickkey

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class KickKeyClassicModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "KickKey"
    }

    /**
     * Returns true if KickKey is the currently active default keyboard.
     */
    @ReactMethod
    fun isDefaultKeyboard(promise: Promise) {
        try {
            val context = reactApplicationContext
            val currentIme = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.DEFAULT_INPUT_METHOD
            )
            val isDefault = currentIme?.contains(context.packageName) ?: false
            promise.resolve(isDefault)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Returns true if KickKey appears in the list of enabled input methods.
     */
    @ReactMethod
    fun isKeyboardEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val enabledMethods = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_INPUT_METHODS
            ) ?: ""
            val isEnabled = enabledMethods.contains(context.packageName)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Opens Android's keyboard settings screen.
     */
    @ReactMethod
    fun openKeyboardSettings() {
        try {
            val context = reactApplicationContext
            val intent = Intent(Settings.ACTION_INPUT_METHOD_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Ignore if settings cannot be opened
        }
    }
}
