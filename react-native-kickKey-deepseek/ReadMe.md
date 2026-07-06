# KickKey Keyboard — Phase 2 (Core Input)

React Native + Expo SDK 57 Android custom keyboard app.

**Phase 1:** Expo project, dual ReactHost, IME service in `:ime_process`, placeholder keyboard rendering inside IME, companion app with setup polling.

**Phase 2 (new):** Real QWERTY keys committed via `NativeModules.KickKey.commitKey()` into any app's text field. Shift/caps lock state machine, symbols panel, long-press alt characters popup, haptic feedback (25ms vibration), backspace with long-press repeat. `KickKeyModule.kt` expanded with `sendBackspace`, `commitSpace`, `sendEnter`, `getPreferences`, `savePreferences`. `InputConnection` lifecycle managed in `KickKeyInputMethodService`. TypeScript 0 errors. keyboard.bundle ~906 KB.

**Build:** `eas build --platform android --profile development`
**Next:** Phase 3 — Bangla Input
