package com.kickkey

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KickKeyModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("KickKey")

        // ── Phase 1: Status checks only ──────────────────────────────────────

        /**
         * Returns true if KickKey is the currently active default keyboard.
         * Used by the companion app's onboarding screen to show setup progress.
         */
        Function("isDefaultKeyboard") {
            val context = appContext.reactContext ?: return@Function false
            val currentIme = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.DEFAULT_INPUT_METHOD
            )
            currentIme?.contains(context.packageName) ?: false
        }

        /**
         * Returns true if KickKey appears in the list of enabled input methods.
         * The user must enable it in Android Settings before it can be selected.
         */
        Function("isKeyboardEnabled") {
            val context = appContext.reactContext ?: return@Function false
            val enabledMethods = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ENABLED_INPUT_METHODS
            ) ?: ""
            enabledMethods.contains(context.packageName)
        }

        /**
         * Opens Android's keyboard settings screen.
         * Called from the onboarding wizard to guide the user through activation.
         */
        Function("openKeyboardSettings") {
            val context = appContext.reactContext ?: return@Function
            val intent = android.content.Intent(
                android.provider.Settings.ACTION_INPUT_METHOD_SETTINGS
            ).apply {
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }

        // ── Phase 2+ methods will be added here: ─────────────────────────────
        // commitKey, sendBackspace, commitSpace, sendEnter,
        // getPreferences, savePreferences, getClipboardHistory
    }
}
