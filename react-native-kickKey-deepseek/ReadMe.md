# KickKey Keyboard — Phase 3 (Bangla Input)

React Native + Expo SDK 57 Android custom keyboard app.

**Phase 1:** Expo project, dual ReactHost, IME service in `:ime_process`, placeholder keyboard.

**Phase 2:** Real QWERTY keys, shift/caps state machine, symbols panel, alt chars popup, haptic feedback, backspace long-press repeat.

**Phase 3 (new):** Avro-style phonetic Bangla input engine with longest-match greedy algorithm & buffer management. Route `bn` language through engine — backspace checks buffer first, space/enter flush. `KeyboardHeader` with composing text display. Bangla QWERTY overlay layout with space "স্পেস". 30+ unit tests. Fixed Devanagari→Bengali Unicode. TypeScript 0 errors. keyboard.bundle ~910 KB.

**Build:** `eas build --platform android --profile development`
