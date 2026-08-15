package com.kickkey

import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewTreeObserver
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import com.facebook.react.ReactHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.ReactChoreographer

class KickKeyInputMethodService : InputMethodService() {

    companion object {
        private const val TAG = "KickKeyIME"
        // Keyboard height in dp. Exactly matches the FULL JS keyboard content:
        // ~234dp with the qykey-style chocolate UI (padding 10 + top row 32 +
        // arrows row 32 + 5 key lines × 32). A little slack is fine — the JS
        // root fills the window (flex: 1) with the chocolate base background.
        private const val KEYBOARD_HEIGHT_DP = 240
        // First watchdog check after this delay, then re-check periodically. The
        // FIRST cold start after install is slow (RN init + 911KB Hermes bundle +
        // Fabric setup can exceed 8s on slow hardware), so we retry a few times
        // before declaring failure instead of erroring at the first check.
        private const val STARTUP_WATCHDOG_MS = 8000L
        private const val WATCHDOG_RETRY_MS = 3000L
        private const val MAX_WATCHDOG_ATTEMPTS = 4

        // Total wall-clock time before the watchdog gives up: 8s + 3×3s = 17s.
        // Used in error messages so they match the real timeout.
        private val TOTAL_WATCHDOG_MS: Long =
            STARTUP_WATCHDOG_MS + WATCHDOG_RETRY_MS * (MAX_WATCHDOG_ATTEMPTS - 1)
    }

    /** Keyboard height in pixels, derived from dp × device density. */
    private val keyboardHeightPx: Int
        get() = (KEYBOARD_HEIGHT_DP * resources.displayMetrics.density).toInt()

    private var reactSurface: ReactSurface? = null
    private var keyboardContainer: FrameLayout? = null
    private var surfaceStartTask: TaskInterface<Void>? = null
    private var watchdog: Runnable? = null
    // Diagnostics: how many times we tried to resume the keyboard ReactHost and the last
    // error. Surfaced in the watchdog error text so a failure is self-diagnosing even
    // without logcat access.
    private var resumeAttempts = 0
    private var resumeLastError: String? = null
    // Monotonic token: bumped on every scheduleJsReadyResume() and on teardown, so a stale
    // resume-poll chain from a previous open stops as soon as a newer one (or a dispose)
    // starts. Also bumped when the watchdog gives up, so the poll can't resume a host whose
    // surface was already detached by the error view.
    private var resumeGeneration = 0L
    // ── Diagnostics for the watchdog error text (no logcat available on device) ─────────
    // Set true when a ReactChoreographer frame callback actually fires — proves the main-thread
    // vsync pump is alive in the IME process. Fabric's DispatchUIFrameCallback (the ONLY thing
    // that applies queued JS mount items to the surface view) lives on this same pump: if the
    // pump is dead, the JS can mount (jsReady=true) but children stays 0 forever.
    private var framePumpAlive = false
    private var framePumpPosted = false
    private var framePumpProbeLogged = false
    // Host/context lifecycle states observed at each watchdog check. A RESUMED → BEFORE_CREATE
    // flip mid-watch means the keyboard ReactHost was DESTROYED (e.g. a lifecycle-listener
    // exception inside ReactContext.onHostResume() triggered ReactHost.destroy()), which also
    // leaves children=0 while the destroy is still tearing the JS down.
    private val hostLifecycleHistory = mutableListOf<String>()
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        KickKeyModule.hapticManager     = HapticManager(this)
        KickKeyModule.banglaEngine      = BanglaInputEngine()
        KickKeyModule.suggestionEngine  = SuggestionEngine(this)
        KickKeyModule.clipboardHandler  = ClipboardHandler(this)
        Log.i(TAG, "IME created — all handlers ready (keyboardHeightPx=${keyboardHeightPx})")

        try {
            val am = getSystemService(AUDIO_SERVICE) as android.media.AudioManager
            am.loadSoundEffects()
        } catch (e: Exception) {
            Log.w(TAG, "Sound pool preload failed: ${e.message}")
        }

        // Pre-warm the React surface immediately on IME service creation
        try {
            ensureSurfaceCreated()
            Log.i(TAG, "Pre-warmed keyboard ReactSurface in IME service onCreate")
        } catch (e: Throwable) {
            Log.w(TAG, "Pre-warming surface failed in onCreate: ${e.message}")
        }
    }

    private fun ensureSurfaceCreated(): View? {
        val existingContainer = keyboardContainer
        val existingSurface = reactSurface
        if (existingContainer != null && existingSurface != null && safeIsRunning(existingSurface)) {
            val parent = existingContainer.parent as? android.view.ViewGroup
            parent?.removeView(existingContainer)
            return existingContainer
        }

        try {
            val app = application as? KickKeyApplication ?: run {
                Log.e(TAG, "KickKeyApplication not found")
                return null
            }
            Log.i(TAG, "Accessing keyboardReactHost...")
            val host = app.keyboardReactHost

            Log.i(TAG, "Creating React surface...")
            val surface = host.createSurface(this, "KickKeyKeyboard", null)
            Log.i(TAG, "Starting React surface...")
            surfaceStartTask = surface.start()
            reactSurface = surface

            val surfaceView = surface.view
            if (surfaceView != null) {
                Log.i(TAG, "Keyboard surface view created — wrapping in FrameLayout")
                val container = object : FrameLayout(this) {
                    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
                        var width = MeasureSpec.getSize(widthMeasureSpec)
                        if (width <= 0) {
                            width = resources.displayMetrics.widthPixels
                        }
                        val height = minOf(
                            keyboardHeightPx,
                            (resources.displayMetrics.heightPixels * 0.9f).toInt().coerceAtLeast(1)
                        )
                        super.onMeasure(
                            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
                        )
                    }
                }.apply {
                    layoutParams = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        keyboardHeightPx
                    )
                    minimumHeight = keyboardHeightPx
                    setBackgroundColor(0xFF0D0D1A.toInt())
                }
                container.addView(surfaceView, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ))

                var surfaceLayoutLogs = 0
                surfaceView.viewTreeObserver.addOnGlobalLayoutListener(
                    object : ViewTreeObserver.OnGlobalLayoutListener {
                        override fun onGlobalLayout() {
                            if (surfaceLayoutLogs >= 3) {
                                surfaceView.viewTreeObserver.removeOnGlobalLayoutListener(this)
                                return
                            }
                            surfaceLayoutLogs++
                            Log.i(
                                TAG,
                                "Surface view laid out: ${surfaceView.width}×${surfaceView.height} " +
                                    "children=${surfaceView.childCount} " +
                                    "attached=${surfaceView.isAttachedToWindow} " +
                                    "isRunning=${safeIsRunning(surface)}"
                            )
                        }
                    }
                )
                keyboardContainer = container

                scheduleJsReadyResume(app)
                scheduleStartupWatchdog(app)
                scheduleMountRetry(app)
                verifyFramePump()

                Log.i(TAG, "Keyboard view created (surface.isRunning=${safeIsRunning(surface)})")
                return container
            } else {
                Log.e(TAG, "surface.view is null")
                return null
            }
        } catch (e: Throwable) {
            Log.e(TAG, "ensureSurfaceCreated FAILED", e)
            return null
        }
    }

    override fun onCreateInputView(): View {
        Log.i(TAG, "onCreateInputView (keyboardHeightPx=${keyboardHeightPx})")

        val bundleProblem = verifyKeyboardBundle()
        if (bundleProblem != null) {
            Log.e(TAG, "keyboard.bundle problem: $bundleProblem")
            return createFallbackView(bundleProblem)
        }

        val container = ensureSurfaceCreated()
        if (container != null) {
            return container
        }
        return createFallbackView("Unable to create keyboard surface view")
    }

    /**
     * After the keyboard view has been shown, verify the keyboard is actually
     * rendering. If it is not (bundle failed to load, host crashed, surface failed
     * to start, or the surface stayed 0×0 / empty), replace the container's content
     * with a visible error message.
     *
     * Success requires ALL THREE:
     *   1. [KickKeyModule.keyboardJsReady] — the keyboard JS signalled readiness
     *      from useEffect, which only happens after its React root mounted and
     *      committed a frame.
     *   2. The surface view has a real laid-out size (>0 × >0). A 0×0 view means
     *      the measure chain collapsed (see onCreateInputView) and Fabric laid the
     *      keyboard out invisibly — ReactSurface.isRunning and isAttachedToWindow
     *      are both unreliable for detecting this, which is why jsReady alone
     *      previously left a black keyboard in place forever.
     *   3. Fabric actually mounted content into the view (childCount > 0).
     *
     * Checks run a few times (cold start is slow) and give up only if none of
     * the success conditions can be met or a fault can be surfaced.
     */
    private fun scheduleStartupWatchdog(app: KickKeyApplication) {
        cancelWatchdog()
        val r = object : Runnable {
            var attempts = 0

            override fun run() {
                attempts++
                val surface = reactSurface ?: return
                try {
                    // Keep (re)trying to install the frame-pump probe until RN is initialized
                    // enough that ReactChoreographer.getInstance() works.
                    verifyFramePump()
                    val view = surface.view
                    val laidOutSize = view != null && view.width > 0 && view.height > 0
                    val hasContent = view != null && view.childCount > 0

                    // ── SUCCESS ──
                    // JS mounted AND the surface view is really sized AND Fabric
                    // mounted content into it → the keyboard is on screen and
                    // rendering. Do not touch the container after this point.
                    //
                    // Why the childCount gate cannot false-positive (the §13
                    // lesson): keyboardReady() fires from useEffect right after the
                    // React commit, but Fabric applies the mount transaction
                    // (adding content views as children of the surface view) on the
                    // UI thread microseconds later. By the first check here (8s) a
                    // WORKING keyboard has long since had both a real size AND ≥1
                    // child. Requiring both for the full 17s window can only mean
                    // the keyboard genuinely rendered nothing visible.
                    if (KickKeyModule.keyboardJsReady && laidOutSize && hasContent) {
                        Log.i(
                            TAG,
                            "Watchdog: keyboard JS mounted & rendering — keyboard OK " +
                                "(lifecycle=${app.keyboardReactHost.lifecycleState} " +
                                "children=${view?.childCount ?: -1})"
                        )
                        return
                    }

                    // ── JS mounted, but nothing visible ──
                    // The keyboard JS committed a frame (keyboardReady fired) yet
                    // the view is 0×0 or empty. This is the black-keyboard case.
                    // Do not leave it undiagnosable forever — surface it.
                    if (KickKeyModule.keyboardJsReady) {
                        verifyFramePump()
                        val host = app.keyboardReactHost
                        // Fallback: In RN 0.86 headless/IME contexts, host.currentReactContext
                        // can return null even though the ReactContext exists (JS called
                        // keyboardReady, proving the bridge is live). Use the stored reference.
                        var ctx: ReactContext? = host.currentReactContext
                        if (ctx == null) {
                            ctx = KickKeyModule.keyboardReactContext
                        }
                        val ctxLifecycle = ctx?.lifecycleState
                        hostLifecycleHistory.add("host=${host.lifecycleState}/ctx=$ctxLifecycle")

                        // ── Detect a destroyed host ──
                        // jsReady implies the jsReady-resume poll already moved the host to
                        // RESUMED, so BEFORE_CREATE here means the host was DESTROYED after
                        // resume (a lifecycle-listener exception inside ReactContext.onHostResume()
                        // → ReactHost.destroy()). A destroyed host never mounts; reset it so the
                        // NEXT open starts with a completely fresh React pipeline, then stop the
                        // watchdog for this open — if we rescheduled, the getter would lazily
                        // recreate a fresh host and the stale jsReady flag would re-trigger this
                        // branch, spinning a create/destroy loop every retry interval.
                        if (host.lifecycleState == LifecycleState.BEFORE_CREATE) {
                            Log.e(
                                TAG,
                                "Watchdog: keyboard ReactHost was DESTROYED after resume " +
                                    "(history=${hostLifecycleHistory.joinToString(" → ")}) — " +
                                    "showing error; next open will create a fresh host"
                            )
                            app.resetKeyboardHostForRetry()
                            showErrorFallback(
                                "Keyboard ReactHost was destroyed after resume",
                                "jsReady=true children=${view?.childCount ?: -1} " +
                                    "lifecycleHistory=${hostLifecycleHistory.joinToString("→")} " +
                                    "resumeAttempts=$resumeAttempts " +
                                    "resumeError=${resumeLastError ?: "none"} — the next keyboard " +
                                    "open will start a completely fresh React pipeline; " +
                                    "check logcat: adb logcat | grep -E 'KickKey|ReactHost|ReactNative'"
                            )
                            return
                        }

                        // ── Belt & suspenders: make sure the mount pipeline is running ──
                        // * If the host isn't RESUMED yet, resume (idempotent, cheap).
                        // * If the host IS resumed but the ReactContext never was (possible when
                        //   currentReactContext was null mid-resume), resume the context directly:
                        //   ReactContext.onHostResume() → FabricUIManager.onHostResume() →
                        //   DispatchUIFrameCallback.resume(), which is what actually applies the
                        //   queued mount items on the next frame.
                        // * requestLayout pushes the current EXACT constraints into C++ again,
                        //   producing a fresh commit + mount transaction in case the first one
                        //   was ever lost.
                        if (host.lifecycleState != LifecycleState.RESUMED) {
                            resumeKeyboardHost(host)
                        } else if (ctxLifecycle != LifecycleState.RESUMED) {
                            // Host IS resumed but the ReactContext never was — resume the
                            // context directly (public API). Skip if the host is not RESUMED
                            // (mid-destroy): poking a dying context only re-fires listeners.
                            // The ctx variable already includes the stored-fallback, so this
                            // covers both host.currentReactContext and the stored reference.
                            try {
                                Log.i(TAG, "Direct-resuming ReactContext (ctx=$ctxLifecycle)")
                                ctx?.onHostResume(null)
                            } catch (e: Exception) {
                                Log.w(TAG, "Direct context resume failed: ${e.message}")
                            }
                        }
                        // Force a re-render: the initial JS commit's mount items may have been
                        // lost because DispatchUIFrameCallback wasn't active at commit time.
                        // A new commit (triggered by this event) generates mount items with the
                        // callback active → they get delivered → children>0.
                        if (ctx != null && view != null && view.childCount == 0) {
                            try {
                                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                    ?.emit("kickkey_forceRerender", null)
                                Log.i(TAG, "Watchdog: emitted kickkey_forceRerender (attempt $attempts)")
                            } catch (e: Exception) {
                                Log.w(TAG, "Watchdog kickkey_forceRerender failed: ${e.message}")
                            }
                        }
                        try { view?.requestLayout() } catch (e: Exception) { /* ignore */ }

                        if (attempts >= MAX_WATCHDOG_ATTEMPTS) {
                            showErrorFallback(
                                "Keyboard mounted but not visible",
                                "jsReady=true view=${view?.width}×${view?.height} " +
                                    "children=${view?.childCount ?: -1} after ~${TOTAL_WATCHDOG_MS / 1000}s " +
                                    "— Fabric mount dispatcher stalled " +
                                    "(ReactHost lifecycle=${host.lifecycleState} " +
                                    "reactContextLifecycle=$ctxLifecycle " +
                                    "framePump=${if (framePumpAlive) "alive" else "stalled/unknown"} " +
                                    "jsPump=${if (KickKeyModule.keyboardPumpActive) "active" else "inactive"} " +
                                    "lifecycleHistory=${hostLifecycleHistory.joinToString("→")} " +
                                    "resumeAttempts=$resumeAttempts " +
                                    "resumeError=${resumeLastError ?: "none"}); " +
                                    "check logcat: adb logcat | grep -E 'KickKey|ReactHost|ReactNative'"
                            )
                        } else {
                            Log.w(
                                TAG,
                                "Watchdog: JS mounted but view not rendering yet " +
                                    "(${view?.width}×${view?.height} children=${view?.childCount ?: -1}, " +
                                    "host=${host.lifecycleState} ctx=$ctxLifecycle " +
                                    "framePump=${if (framePumpAlive) "alive" else "unknown"}, " +
                                    "attempt $attempts)"
                            )
                            mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                        }
                        return
                    }

                    // ── Surface running, JS not mounted yet ──
                    if (safeIsRunning(surface)) {
                        if (attempts >= MAX_WATCHDOG_ATTEMPTS) {
                            showErrorFallback(
                                "Keyboard JS did not mount",
                                "surface.isRunning=true jsReady=false after ~${TOTAL_WATCHDOG_MS / 1000}s " +
                                    "— check logcat: adb logcat | grep -E 'KickKey|ReactHost|ReactNative'"
                            )
                        } else {
                            Log.w(TAG, "Watchdog: surface running but JS mount signal not received yet (attempt $attempts)")
                            mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                        }
                        return
                    }

                    val hostFault = app.keyboardStartTask?.takeIf { it.isFaulted() }?.getError()
                    if (hostFault != null) {
                        Log.e(TAG, "Keyboard ReactHost failed to start", hostFault)
                        showErrorFallback("Keyboard ReactHost failed to start", hostFault.message)
                        return
                    }

                    val surfaceFault = surfaceStartTask?.takeIf { it.isFaulted() }?.getError()
                    if (surfaceFault != null) {
                        Log.e(TAG, "Keyboard React surface failed to start", surfaceFault)
                        showErrorFallback("Keyboard React surface failed to start", surfaceFault.message)
                        return
                    }

                    // Not running and no JS signal yet — the first cold start after
                    // install (RN init + bundle load + Fabric setup) can take >8s.
                    // Retry a few times before declaring failure.
                    if (attempts >= MAX_WATCHDOG_ATTEMPTS) {
                        // Surface as much state as possible: with no logcat access this
                        // error text is the only diagnostic the user can paste back.
                    val startState = when {
                        app.keyboardStartTask?.isFaulted() == true -> "faulted"
                        app.keyboardStartTask?.isCompleted() == true -> "completed"
                        else -> "pending"
                    }
                    val surfaceState = when {
                        surfaceStartTask?.isFaulted() == true -> "faulted"
                        surfaceStartTask?.isCompleted() == true -> "completed"
                        else -> "pending"
                    }
                    showErrorFallback(
                        "Keyboard did not start within ${TOTAL_WATCHDOG_MS / 1000}s",
                        "isRunning=${safeIsRunning(surface)} jsReady=${KickKeyModule.keyboardJsReady} " +
                            "hostLifecycle=${app.keyboardReactHost.lifecycleState} " +
                            "ctxLifecycle=${app.keyboardReactHost.currentReactContext?.lifecycleState ?: KickKeyModule.keyboardReactContext?.lifecycleState} " +
                            "startTask=$startState surfaceTask=$surfaceState " +
                            "view=${view?.width}×${view?.height} children=${view?.childCount ?: -1} " +
                            "framePump=${if (framePumpAlive) "alive" else "stalled/unknown"} " +
                            "jsPump=${if (KickKeyModule.keyboardPumpActive) "active" else "inactive"} " +
                            "resumeAttempts=$resumeAttempts resumeError=${resumeLastError ?: "none"} " +
                            "— check logcat: adb logcat | grep -E 'KickKey|ReactHost|ReactNative'"
                    )
                    } else {
                        Log.w(TAG, "Watchdog: surface not running yet (attempt $attempts) — retrying")
                        mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                    }
                } catch (e: Exception) {
                    // A transient exception must not silently kill the watchdog and
                    // leave a possibly-working keyboard unmonitored — retry unless
                    // we've exhausted the attempts.
                    Log.w(TAG, "Watchdog check failed (attempt $attempts): ${e.message}")
                    if (attempts < MAX_WATCHDOG_ATTEMPTS) {
                        mainHandler.postDelayed(this, WATCHDOG_RETRY_MS)
                    }
                }
            }
        }
        watchdog = r
        mainHandler.postDelayed(r, STARTUP_WATCHDOG_MS)
    }

    private fun cancelWatchdog() {
        watchdog?.let { mainHandler.removeCallbacks(it) }
        watchdog = null
    }

    // ── Fast mount-retry loop ─────────────────────────────────────────────────────
    // The JS-side mount pump (keyboard.index.js) fixes the children=0 black keyboard by
    // keeping the JS event loop alive so the C++ RuntimeScheduler's updateRendering()
    // drains pending Fabric mount transactions. `kickkey_forceRerender` now forces a
    // REAL remount (fresh CREATE/INSERT mutations) as a safety net for a lost initial
    // transaction. This loop drives both while jsReady=true and children=0, so the
    // keyboard recovers in ~1s instead of waiting for the 8s startup watchdog. Stops on
    // success, on teardown, or once the startup watchdog takes over (showErrorFallback).
    private var mountRetryGeneration = 0L

    private fun scheduleMountRetry(app: KickKeyApplication) {
        val generation = ++mountRetryGeneration
        mainHandler.postDelayed(
            object : Runnable {
                var attempts = 0

                override fun run() {
                    if (generation != mountRetryGeneration) return
                    val surface = reactSurface ?: return
                    val view = surface.view
                    // Keyboard visible — done. (Also the success path for the watchdog.)
                    if (view != null && view.childCount > 0) return
                    // Cap at ~17s so we stop quietly before the watchdog's give-up window;
                    // the watchdog owns the final error view.
                    if (attempts >= 17) return
                    attempts++
                    if (KickKeyModule.keyboardJsReady) {
                        try {
                            val host = app.keyboardReactHost
                            // Belt & suspenders: keep the host resumed and the constraints
                            // re-asserted while the mount pipeline is still draining.
                            if (host.lifecycleState != LifecycleState.RESUMED) {
                                resumeKeyboardHost(host)
                            }
                            try { view?.requestLayout() } catch (e: Exception) { /* ignore */ }
                            val ctx = host.currentReactContext ?: KickKeyModule.keyboardReactContext
                            if (ctx != null && view != null && view.childCount == 0) {
                                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                    ?.emit("kickkey_forceRerender", null)
                                Log.i(TAG, "Mount retry: emitted kickkey_forceRerender (attempt $attempts)")
                                // A remount re-creates the JS keyboard subtree and resets its
                                // input-type state — re-emit it shortly after so number / phone /
                                // password fields restore their correct layout.
                                mainHandler.postDelayed({
                                    if (generation != mountRetryGeneration) return@postDelayed
                                    reemitInputStarted()
                                }, 300)
                            }
                        } catch (e: Exception) {
                            Log.w(TAG, "Mount retry check failed (attempt $attempts): ${e.message}")
                        }
                    }
                    mainHandler.postDelayed(this, 1000)
                }
            },
            1000
        )
    }

    /** Re-emits the most recent onInputStarted payload (used after a forceRerender remount). */
    private fun reemitInputStarted() {
        val params = KickKeyModule.lastInputStartedParams ?: return
        try {
            val app = application as? KickKeyApplication ?: return
            val ctx = app.keyboardReactHost.currentReactContext ?: KickKeyModule.keyboardReactContext
                ?: return
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onInputStarted", params)
            Log.i(TAG, "Re-emitted onInputStarted after mount retry")
        } catch (e: Exception) {
            Log.w(TAG, "reemitInputStarted failed: ${e.message}")
        }
    }

    /**
     * Brings the keyboard ReactHost to LifecycleState.RESUMED so Fabric's
     * DispatchUIFrameCallback starts and applies the queued JS mount items to the surface
     * view (the ONLY thing that turns the black keyboard into visible keys).
     *
     * A normal RN app reaches RESUMED because its host Activity calls ReactHost.
     * onHostResume() in onResume(). An InputMethodService has no Activity, so the keyboard
     * host must be resumed explicitly — but ONLY after the JS is fully mounted.
     *
     * Why gate on [KickKeyModule.keyboardJsReady] instead of the instance/start task (a
     * previous iteration)?
     *  - Resuming before the instance existed moved the lifecycle to RESUMED prematurely
     *    and broke JS startup in release builds (silent host destroy → jsReady=false after
     *    17s, §16).
     *  - Resuming on startTask completion could fire while the JS bundle was still executing
     *    (the task completes when the instance is created, not when JS is up), and an 8s poll
     *    cap could expire entirely on a slow first cold start, leaving the host BEFORE_CREATE
     *    forever — both observed as black keyboards (§17).
     *  - keyboardJsReady only becomes true after the React root committed a frame: the
     *    instance, bundle, surface and every native module are then fully initialized.
     *    Resuming at that moment is exactly what a normal Activity does in onResume() after
     *    startup, with no bootstrap in flight.
     *
     * The poll is idempotent (moveToOnHostResume() early-returns once RESUMED) and retries
     * a failed resume until it sticks or the 30s window expires.
     */
    private fun scheduleJsReadyResume(app: KickKeyApplication) {
        resumeAttempts = 0
        resumeLastError = null
        val generation = ++resumeGeneration
        pollJsReadyResume(app, 0, generation)
    }

    private fun pollJsReadyResume(app: KickKeyApplication, attempt: Int, generation: Long) {
        // A newer open (or a teardown / watchdog give-up) bumped the generation — stop this
        // stale chain so it can never resume the wrong lifecycle or leak for 30s.
        if (generation != resumeGeneration) return
        // 600 × 50ms = 30s — comfortably beyond the watchdog's 17s give-up window, so a very
        // slow cold start (RN init + 1.2MB Hermes bundle + Fabric setup on slow hardware) still
        // gets its resume. The 50ms poll (instead of 250ms) minimizes the black-screen window
        // after the JS signals readiness: the resume — and therefore the first visible keys —
        // now land within ~1 frame of keyboardReady() instead of up to a quarter second later.
        if (attempt >= 600) {
            Log.w(TAG, "scheduleJsReadyResume: JS never signalled readiness — watchdog will surface the failure")
            return
        }
        mainHandler.postDelayed({
            try {
                if (generation != resumeGeneration) return@postDelayed
                val host = app.keyboardReactHost
                if (host.lifecycleState == LifecycleState.RESUMED) return@postDelayed // idempotent — done
                if (KickKeyModule.keyboardJsReady) {
                    resumeKeyboardHost(host)
                    // If the resume didn't take (it threw, or the lifecycle didn't move), retry
                    // — the watchdog's periodic checks will also retry while the keyboard is up.
                    if (host.lifecycleState != LifecycleState.RESUMED) {
                        pollJsReadyResume(app, attempt + 1, generation)
                    }
                } else {
                    pollJsReadyResume(app, attempt + 1, generation)
                }
            } catch (e: Exception) {
                Log.w(TAG, "pollJsReadyResume failed: ${e.message}")
            }
        }, 50)
    }

    private fun resumeKeyboardHost(host: ReactHost) {
        resumeAttempts++
        try {
            // Idempotent: if already RESUMED, moveToOnHostResume() early-returns. With jsReady
            // true the ReactInstance and JS are fully up, so this dispatches ReactContext.
            // onHostResume() cleanly → DispatchUIFrameCallback starts → the mount items queued
            // by the JS commit are applied on the next frame → keys appear.
            host.onHostResume(null)

            // Safety net: if the host reached RESUMED but the ReactContext itself was never
            // resumed (possible when currentReactContext was null at the moment of resume), fire
            // the context resume directly. ReactContext.onHostResume() → FabricUIManager.
            // onHostResume() → DispatchUIFrameCallback.resume() is what actually flushes the
            // queued mount items; the host-level state alone does nothing if the listeners never
            // fired.
            //
            // Fallback: In RN 0.86's new architecture, host.currentReactContext can return null
            // even after the host is RESUMED (a known issue in headless/IME contexts). Since
            // keyboardReady() is a @ReactMethod, the ReactContext must exist when it runs —
            // KickKeyModule.keyboardReactContext gives us a reliable fallback.
            var ctx: ReactContext? = host.currentReactContext
            if (ctx == null) {
                ctx = KickKeyModule.keyboardReactContext
                if (ctx != null) {
                    Log.i(TAG, "Using stored ReactContext for resume (host.currentReactContext is null)")
                }
            }
            if (ctx != null && host.lifecycleState == LifecycleState.RESUMED &&
                ctx.lifecycleState != LifecycleState.RESUMED
            ) {
                Log.i(
                    TAG,
                    "ReactContext not resumed after host resume (host=${host.lifecycleState} " +
                        "ctx=${ctx.lifecycleState}) — resuming context directly"
                )
                ctx.onHostResume(null)
            }
            // Keep resumeLastError as-is: it records the most recent failure for the watchdog
            // error text (a flaky resume that eventually succeeded is still worth knowing about).
            Log.i(
                TAG,
                "Keyboard ReactHost resumed (lifecycle=${host.lifecycleState}, " +
                    "ctx=${ctx?.lifecycleState})"
            )

            // ── Force a remount ONLY if the surface is still empty ──────────────────
            // In RN 0.86 Fabric, the initial JS commit's mount transaction can be LOST
            // before the pipeline was running. After resuming the host, emit an event that
            // forces a REAL remount (keyboard.index.js bumps the root key) so a brand-new
            // set of CREATE/INSERT mount mutations is generated for the JS mount pump to
            // flush. Gated on the view still being empty (childCount==0) so a WORKING
            // keyboard is never remounted — a remount would reset keyboard state (language,
            // shift, and the number/phone/password flags from onInputStarted).
            val rerenderCtx = ctx ?: KickKeyModule.keyboardReactContext
            val surfaceStillEmpty = try {
                reactSurface?.view?.childCount == 0
            } catch (e: Exception) {
                true
            }
            if (rerenderCtx != null && host.lifecycleState == LifecycleState.RESUMED &&
                surfaceStillEmpty
            ) {
                mainHandler.post {
                    try {
                        rerenderCtx
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            ?.emit("kickkey_forceRerender", null)
                        Log.i(TAG, "Emitted kickkey_forceRerender event immediately (ctx=${rerenderCtx.lifecycleState})")
                    } catch (e: Exception) {
                        Log.w(TAG, "kickkey_forceRerender emit failed: ${e.message}")
                    }
                }
            }
        } catch (e: Exception) {
            // Never let a resume failure silently kill the keyboard — record it so the
            // watchdog surfaces it in the error text, and retry on the next poll.
            resumeLastError = e.message ?: e.javaClass.simpleName
            Log.w(TAG, "Keyboard ReactHost resume failed (attempt $resumeAttempts): ${e.message}")
        }
    }

    /**
     * Posts a one-shot frame callback to ReactChoreographer to prove the main-thread frame pump
     * is alive in the IME process. Fabric's DispatchUIFrameCallback (which applies queued JS
     * mount items to the surface view) runs on this same pump, so a dead pump = keyboard stays
     * black with jsReady=true and children=0. The result is surfaced in the watchdog error text
     * (framePump=alive vs stalled/unknown).
     */
    private fun verifyFramePump() {
        if (framePumpAlive || framePumpPosted) return
        try {
            ReactChoreographer.getInstance().postFrameCallback(
                ReactChoreographer.CallbackType.DISPATCH_UI
            ) {
                if (!framePumpAlive) {
                    framePumpAlive = true
                    Log.i(TAG, "Frame pump ALIVE — Choreographer ticks in the IME process")
                }
            }
            framePumpPosted = true
        } catch (e: Exception) {
            // ReactChoreographer.getInstance() throws before RN is initialized — retry on the
            // next watchdog check. Log once (not every check) to avoid spamming.
            if (!framePumpProbeLogged) {
                framePumpProbeLogged = true
                Log.w(TAG, "Frame pump probe unavailable yet: ${e.message}")
            }
        }
    }

    private fun safeIsRunning(surface: ReactSurface?): Boolean = try {
        surface?.isRunning == true
    } catch (e: Exception) {
        false
    }

    private fun showErrorFallback(reason: String, detail: String?) {
        Log.e(TAG, "showErrorFallback: $reason | $detail")
        // The keyboard has been declared dead — stop the resume poll and the mount-retry
        // loop so they can't resume a host / remount a surface that's about to be (or
        // already was) detached by the error view.
        resumeGeneration++
        mountRetryGeneration++
        // If the JS was up but the mount pipeline never delivered (or the host was destroyed),
        // reset the keyboard ReactHost so the next keyboard open starts with a completely fresh
        // React pipeline (new FabricUIManager / MountItemDispatcher) instead of reusing a wedged
        // one. Only done when jsReady was true — if JS never mounted, the host itself is healthy
        // and the next open should reuse it.
        try {
            if (KickKeyModule.keyboardJsReady) {
                // Clear the stored ReactContext so the next open captures a fresh one.
                KickKeyModule.keyboardReactContext = null
                val app = application as? KickKeyApplication
                app?.resetKeyboardHostForRetry()
            }
        } catch (e: Exception) {
            Log.w(TAG, "showErrorFallback: host reset failed: ${e.message}")
        }
        val container = keyboardContainer ?: return
        try {
            val message = if (detail.isNullOrBlank()) reason else "$reason — $detail"
            val fallback = createFallbackView(message)
            container.removeAllViews()
            container.addView(fallback, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))
        } catch (e: Exception) {
            Log.w(TAG, "showErrorFallback failed", e)
        }
    }

    /**
     * Verifies assets://keyboard.bundle exists and looks like Hermes bytecode
     * (magic bytes \u00C6\u001F\u00BC\u0003). Returns null when OK, otherwise a
     * human-readable reason for the fallback error view.
     */
    private fun verifyKeyboardBundle(): String? {
        return try {
            assets.open("keyboard.bundle").use { input ->
                val header = ByteArray(4)
                val read = input.read(header)
                if (read < 4) "keyboard.bundle is truncated (${read} bytes read)"
                else if (!(header[0] == 0xC6.toByte() && header[1] == 0x1F.toByte() &&
                           header[2] == 0xBC.toByte() && header[3] == 0x03.toByte()))
                    "keyboard.bundle is not Hermes bytecode (magic ${header.joinToString { "%02X".format(it.toInt() and 0xFF) }})"
                else null
            }
        } catch (e: java.io.FileNotFoundException) {
            "keyboard.bundle is MISSING from APK assets — run 'node scripts/build-keyboard-bundle.js' and rebuild"
        } catch (e: Exception) {
            "keyboard.bundle unreadable: ${e.message}"
        }
    }

    private fun createFallbackView(message: String): View {
        Log.e(TAG, "FALLBACK VIEW SHOWN: $message")
        val tv = android.widget.TextView(this).apply {
            text = "KickKey Error: $message\n\nCheck logcat: adb logcat | grep KickKey"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 12f
            setPadding(24, 24, 24, 24)
            setBackgroundColor(0xFF1A1A2E.toInt()) // Dark background so text is visible
        }
        return FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                keyboardHeightPx
            )
            setBackgroundColor(0xFF1A1A2E.toInt()) // Dark background
            addView(tv, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))
        }
    }

    private fun disposeSurface() {
        cancelWatchdog()
        // Stop any stale resume-poll chain and mount-retry loop (generation-guarded).
        resumeGeneration++
        mountRetryGeneration++
        try {
            reactSurface?.stop()
            reactSurface = null
            keyboardContainer?.removeAllViews()
            keyboardContainer = null
            surfaceStartTask = null
            // Reset the JS mount flag whenever the surface is torn down so a stale
            // "ready" from a previous surface/session can never mask a genuinely
            // dead keyboard in the next open cycle.
            KickKeyModule.keyboardJsReady = false
            // Clear the stored ReactContext — the next open will capture a fresh one
            // when keyboardReady() is called.
            KickKeyModule.keyboardReactContext = null
        } catch (e: Exception) {
            Log.w(TAG, "disposeSurface error: ${e.message}")
        }
    }

    override fun onStartInputView(info: EditorInfo, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        KickKeyModule.activeInputConnection = currentInputConnection
        KickKeyModule.banglaEngine?.reset()
        KickKeyModule.suggestionEngine?.reset()

        val typeClass  = info.inputType and 0x0000000F
        val isPassword = (info.inputType and 0x000000D0) != 0
        val isNumber   = typeClass == 0x00000002
        val isPhone    = typeClass == 0x00000003
        val isUrl      = (info.inputType and 0x000000F0) == 0x00000020
        val isEmail    = (info.inputType and 0x000000F0) == 0x00000050

        KickKeyModule.suggestionEngine?.setEnabled(!isPassword)

        if (!isPassword && !restarting) {
            KickKeyModule.clipboardHandler?.captureCurrentClipboard()
        }

        emitInputStarted(info, isPassword, isNumber, isPhone, isUrl, isEmail)

        Log.i(TAG, "InputStarted — class=$typeClass password=$isPassword number=$isNumber phone=$isPhone url=$isUrl")
    }

    private fun emitInputStarted(
        info: EditorInfo,
        isPassword: Boolean, isNumber: Boolean, isPhone: Boolean,
        isUrl: Boolean, isEmail: Boolean,
        attempt: Int = 0,
    ) {
        try {
            val app = application as? KickKeyApplication ?: return
            // Fallback: use stored ReactContext when host.currentReactContext is null
            var reactContext = app.keyboardReactHost.currentReactContext
            if (reactContext == null) {
                reactContext = KickKeyModule.keyboardReactContext
            }
            if (reactContext == null) {
                // The keyboard ReactHost starts asynchronously — if the JS context
                // isn't ready yet, the very first input-type event would be lost
                // (wrong layout for number/phone/password fields). Retry briefly.
                if (attempt < 10) {
                    Log.d(TAG, "emitInputStarted: React context not ready yet (attempt $attempt) — retrying")
                    mainHandler.postDelayed({
                        emitInputStarted(info, isPassword, isNumber, isPhone, isUrl, isEmail, attempt + 1)
                    }, 200)
                }
                return
            }
            val imeAction = when (info.imeOptions and EditorInfo.IME_MASK_ACTION) {
                EditorInfo.IME_ACTION_SEARCH -> "search"
                EditorInfo.IME_ACTION_SEND   -> "send"
                EditorInfo.IME_ACTION_DONE   -> "done"
                EditorInfo.IME_ACTION_NEXT   -> "next"
                EditorInfo.IME_ACTION_GO     -> "go"
                else                         -> "return"
            }
            val params = Arguments.createMap().apply {
                putInt("inputType", info.inputType)
                putBoolean("isPassword", isPassword)
                putBoolean("isNumber",   isNumber)
                putBoolean("isPhone",    isPhone)
                putBoolean("isUrl",      isUrl)
                putBoolean("isEmail",    isEmail)
                putString("imeAction",   imeAction)
            }
            // Store the payload so the mount-retry loop can re-emit it after a
            // forceRerender remount (which resets the JS input-type state).
            KickKeyModule.lastInputStartedParams = params
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onInputStarted", params)
        } catch (e: Exception) {
            Log.w(TAG, "emitInputStarted failed: ${e.message}")
        }
    }

    override fun onFinishInput() {
        super.onFinishInput()
        val pending = KickKeyModule.banglaEngine?.flush() ?: ""
        if (pending.isNotEmpty()) KickKeyModule.activeInputConnection?.commitText(pending, 1)
        KickKeyModule.activeInputConnection = null
    }

    override fun onWindowHidden() {
        super.onWindowHidden()
        KickKeyModule.activeInputConnection = null
        KickKeyModule.banglaEngine?.reset()
        KickKeyModule.suggestionEngine?.reset()
    }

    override fun onDestroy() {
        disposeSurface()
        KickKeyModule.hapticManager    = null
        KickKeyModule.banglaEngine     = null
        KickKeyModule.suggestionEngine = null
        KickKeyModule.clipboardHandler = null
        super.onDestroy()
        Log.i(TAG, "IME destroyed")
    }
}
