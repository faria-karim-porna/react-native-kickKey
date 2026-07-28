package com.kickkey

import android.app.Application
import android.content.res.Configuration
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

class KickKeyApplication : Application(), ReactApplication {

    companion object {
        private const val TAG = "KickKeyApplication"
    }

    // Mutex for thread-safe keyboard host initialization
    private val keyboardInitLock = Any()

    // ── Main ReactHost (managed by Expo, uses main bundle) ──────────
    override val reactHost: ReactHost by lazy {
        ExpoReactHostFactory.getDefaultReactHost(
            context = applicationContext,
            packageList = PackageList(this).packages.apply {
                // Auto-linked packages are handled by Expo
            }
        )
    }

    // ── Keyboard ReactHost (pre-warmed, uses keyboard.bundle) ────────────────
    @Volatile
    private var _keyboardReactHost: ReactHost? = null

    @Volatile
    private var _keyboardHostReady: Boolean = false

    val isKeyboardHostReady: Boolean
        get() = _keyboardHostReady

    val keyboardReactHost: ReactHost
        get() {
            val host = _keyboardReactHost
            if (host != null) return host
            // Synchronous fallback: initialize on caller's thread
            // This should only happen on very first app launch before pre-warm completes
            initKeyboardRuntime()
            return _keyboardReactHost!!
        }

    override fun onCreate() {
        super.onCreate()

        // Initialize Expo module lifecycle
        ApplicationLifecycleDispatcher.onApplicationCreate(this)

        // Set release level for React Native
        DefaultNewArchitectureEntryPoint.releaseLevel = try {
            ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
        } catch (e: IllegalArgumentException) {
            ReleaseLevel.STABLE
        }

        // Pre-warm the keyboard JS runtime on a background thread.
        // This runs at app start so that by the time the user taps any
        // text field, Hermes + keyboard.bundle are already loaded.
        Thread {
            try {
                initKeyboardRuntime()
                Log.i(TAG, "Keyboard ReactHost pre-warm complete")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to pre-warm keyboard ReactHost", e)
            }
        }.apply {
            name = "KickKey-PreWarm"
            isDaemon = true
            start()
        }
    }

    @OptIn(UnstableReactNativeAPI::class)
    private fun initKeyboardRuntime() {
        // Thread-safe single initialization
        if (_keyboardReactHost != null) return

        synchronized(keyboardInitLock) {
            if (_keyboardReactHost != null) return

            val keyboardDelegate = object : ReactHostDelegate {
                override val jsMainModulePath: String = "keyboard.index"

                override val jsBundleLoader: JSBundleLoader
                    get() = JSBundleLoader.createAssetLoader(
                        this@KickKeyApplication,
                        "assets://keyboard.bundle",
                        true
                    )

                override val jsRuntimeFactory: JSRuntimeFactory
                    get() = HermesInstance()

                // Only include the KickKey native module — no Expo modules needed
                // for the keyboard bundle running in the IME process
                override val reactPackages: List<ReactPackage>
                    get() = listOf(KickKeyPackage())

                override val bindingsInstaller: BindingsInstaller? = null

                override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder
                    get() = DefaultTurboModuleManagerDelegate.Builder()

                override fun handleInstanceException(error: Exception) {
                    Log.e(TAG, "Keyboard ReactHost instance exception", error)
                }
            }

            val componentFactory = ComponentFactory()
            DefaultComponentsRegistry.register(componentFactory)

            val keyboardHost = ReactHostImpl(
                this,
                delegate = keyboardDelegate,
                componentFactory = componentFactory,
                allowPackagerServerAccess = false,  // Keyboard bundle doesn't need Metro
                useDevSupport = ReactBuildConfig.DEBUG
            )

            _keyboardReactHost = keyboardHost

            // Start loading JS — this is the expensive step (~200-500ms first time)
            // After this, keyboard opens in ~50-80ms
            keyboardHost.start()
            _keyboardHostReady = true
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }

    override fun onTerminate() {
        super.onTerminate()
        ApplicationLifecycleDispatcher.onApplicationTerminate(this)
    }
}
