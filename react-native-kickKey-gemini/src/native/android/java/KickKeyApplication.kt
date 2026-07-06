package com.kickkey

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.common.LifecycleState
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class KickKeyApplication : Application(), ReactApplication {

    companion object {
        private const val TAG = "KickKeyApplication"
    }

    // ── Companion app ReactNativeHost (managed by Expo, uses main.bundle) ──────────
    override val reactNativeHost: ReactNativeHost
        get() = ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Add KickKey native module package
                    add(KickKeyPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = false   // old arch
            override val isHermesEnabled: Boolean = true
        })

    // ── Keyboard ReactInstanceManager (pre-warmed, uses keyboard.bundle) ────────────────
    lateinit var reactInstanceManager: ReactInstanceManager
        private set

    override fun onCreate() {
        super.onCreate()

        // Initialize Expo module lifecycle
        ApplicationLifecycleDispatcher.onApplicationCreate(this)

        // Pre-warm the keyboard JS runtime on a background thread.
        // This runs at app start so that by the time the user taps any
        // text field, Hermes + keyboard.bundle are already loaded.
        Thread {
            try {
                initKeyboardRuntime()
                Log.i(TAG, "Keyboard ReactInstanceManager pre-warm complete")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to pre-warm keyboard ReactInstanceManager", e)
            }
        }.apply {
            name = "KickKey-PreWarm"
            isDaemon = true
            start()
        }
    }

    private fun initKeyboardRuntime() {
        // Build a ReactInstanceManager that loads keyboard.bundle (not the full main.bundle)
        // This is the standalone React Native runtime for the keyboard UI only.
        reactInstanceManager = ReactInstanceManager.builder()
            .setApplication(this)
            .setCurrentActivity(null) // Important: No Activity host!
            .setBundleAssetName("keyboard.bundle")
            .setJSMainModulePath("keyboard.index")
            .addPackage(MainReactPackage())
            .addPackage(KickKeyPackage()) // only our bridge package
            .setUseDeveloperSupport(BuildConfig.DEBUG)
            .setInitialLifecycleState(LifecycleState.RESUMED)
            .build()

        // Start loading JS in the background
        reactInstanceManager.createReactContextInBackground()
    }

    override fun onTerminate() {
        super.onTerminate()
        ApplicationLifecycleDispatcher.onApplicationTerminate(this)
    }
}
