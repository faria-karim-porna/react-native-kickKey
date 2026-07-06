# KickKey Keyboard — Phase 4 (Suggestions & Autocorrect)

React Native + Expo SDK 57 Android custom keyboard app.

**Phase 1:** Expo project, dual ReactHost, IME service in `:ime_process`, placeholder keyboard.

**Phase 2:** Real QWERTY keys, shift/caps state machine, symbols panel, alt chars popup, haptic feedback, backspace long-press repeat.

**Phase 3:** Avro-style phonetic Bangla input engine with longest-match greedy algorithm & buffer management, KeyboardHeader, Bangla QWERTY overlay layout.

**Phase 4 (new):** Binary Trie (prefix + Levenshtein fuzzy search) with Python compiler script (~17KB english, ~13KB bangla .bin files). `SuggestionEngine` orchestrates Trie + user model with 50ms debounce on background thread — emits `onSuggestionsUpdated` events to RN. `commitSpace` auto-corrects top suggestion; tappable chips via `commitSuggestion` with UserWordModel frequency boosting. Password field suppression. `sendEnter` clears suggestions. Thread-safe emission on main thread. TypeScript 0 errors. keyboard.bundle ~911 KB.

**Build:** `python3 scripts/compile_dictionaries.py && eas build --platform android --profile development`
