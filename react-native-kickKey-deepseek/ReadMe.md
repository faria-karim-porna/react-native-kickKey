# KickKey Keyboard — Phase 1 (Foundation)

React Native + Expo SDK 57 Android custom keyboard app.

**Implemented:**
- Expo project with dual ReactHost (main app + pre-warmed keyboard bundle)
- `KickKeyApplication.kt` — pre-warms Hermes + keyboard.bundle on app boot
- `KickKeyInputMethodService.kt` — IME service returning ReactRootView
- AndroidManifest configured via config plugin with `:ime_process` isolation
- Placeholder keyboard UI (KeyboardScreen.tsx) rendering inside IME
- Companion app (App.tsx) with setup status polling
- `KickKeyModule.kt` — native bridge for isKeyboardEnabled/isDefaultKeyboard
- keyboard.bundle built at ~891 KB

**Build:** `eas build --platform android --profile development`
**Next:** Phase 2 — Core Input (keypress wiring, backspace, shift)
