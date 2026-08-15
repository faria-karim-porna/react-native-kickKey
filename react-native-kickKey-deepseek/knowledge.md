# Project knowledge

This file gives Freebuff context about your project: goals, commands, conventions, and gotchas.

## What this is

**KickKey** — An Android custom keyboard app built with React Native + Expo SDK 57. Written in TypeScript (frontend/companion app) and Kotlin (IME service, native modules). Android-only (Expo config sets `"platforms": ["android"]`).

The app has **two separate React Native bundles** loaded into the same process:
1. **Keyboard bundle** — Entry: `keyboard.index.js`. Registers `KickKeyKeyboard` component. Runs inside `:ime_process` via `KickKeyInputMethodService.kt`. Must NOT import from the companion app.
2. **Companion app** — Entry: `expo-router/entry` (`app/` directory). Runs 5-tab layout + 3-step onboarding wizard. Uses Expo Router.

## Quickstart

```sh
# Install
npm install

# Compile dictionary .txt files into binary Trie .bin files
python3 scripts/compile_dictionaries.py

# Run on connected Android device/emulator
npm run android

# Start Expo dev server (without running on device)
npm start

# Build for production
eas build --platform android --profile development
eas build --platform android --profile production
```

## Project structure

```
app/                          # Companion app screens (Expo Router)
  (tabs)/                     # Tab navigation: Home, Settings, Themes, Language, Dictionary
    index.tsx                 # Home tab (live setup status + try-it text field)
    settings.tsx              # Haptic/sound/autocorrect toggles
    themes.tsx                # Dark/Light/AMOLED + key height/radius/font sliders
    language.tsx              # English/Bangla selector
    dictionary.tsx            # Custom word list editor
    _layout.tsx               # Tab navigator layout
  onboarding/                 # 3-step wizard (enable → set default → done)
  _layout.tsx                 # Root layout (onboarding vs tabs)

components/                   # Reusable UI components
  LanguageTag.tsx, SetupProgress.tsx, ThemeCard.tsx, ToggleRow.tsx

constants/Themes.ts           # Theme color definitions

hooks/
  useKickKeyBridge.ts         # Bridge calls to native module
  useSettingsSync.ts          # Zustand → SharedPreferences sync
  useSetupStatus.ts           # Polls keyboard enable/default status

src/keyboard/                 # Keyboard bundle code (loaded in :ime_process)
  KeyboardScreen.tsx          # Root keyboard component (ErrorBoundary + QykeyKeyboard)
  ErrorBoundary.tsx           # Catches JS errors and shows them on-screen
  hooks/useKeyboardState.ts   # State + native wiring (en-US / bn-BD / banglish)
  data/soundManager.ts        # Optional key-click sound
  qykey/                      # "Chocolate bar" UI ported from the qykey reference
    QykeyKeyboard.tsx         # Orchestrator (slider, top keys, arrows, main keys, emoji, touchpad)
    styles.ts                 # Chocolate neumorphic styles (exact qykey look)
    Key.tsx, MainKeys.tsx     # Chocolate keys + letter rows / bottom row
    KeyboardSlider.tsx        # Keyboard ⇄ touchpad toggle
    KeyboardTopKeys.tsx       # Emoji / suggestions / SYM / mic strip
    SymbolKeys.tsx, SymbolKeysMore.tsx  # Symbol + system-key pages (F-keys)
    EmojiBoard.tsx            # Emoji picker (data re-exported from qykey/helper/data)
    Touchpad.tsx              # Mouse-mode surface (visual-only for now)
    FeatheredArrowKey.tsx     # Arrow glyphs
    speechRecognition.ts      # Mic stub (RECORD_AUDIO blocked; no speech module)
    emojiData.ts              # Re-exports qykey/helper/data emojis

store/settingsStore.ts        # Zustand store with AsyncStorage persistence

modules/kickkey-module/       # Native module bridge (TypeScript side)
  index.ts                    # All native functions exposed to JS

plugins/                      # Expo config plugins
  withImeService.js           # Registers IME service in AndroidManifest
  withKeyboardBundle.js       # Configures separate keyboard bundle

scripts/compile_dictionaries.py  # Python script to build binary Trie files

assets/dictionaries/          # Word list files and compiled binary Tries
  english.txt, english.bin    # English dictionary (~17 KB)
  bangla.txt, bangla.bin      # Bangla dictionary (~13 KB)
```

## Native module functions

Defined in `modules/kickkey-module/index.ts` — calls through to `KickKey` NativeModule (Kotlin):

| Category | Functions |
|---|---|
| Setup | `isDefaultKeyboard()`, `isKeyboardEnabled()`, `openKeyboardSettings()` |
| Input | `commitKey()`, `sendBackspace()`, `commitSpace()`, `sendEnter()` |
| Suggestions | `commitSuggestion()`, `setBanglaEnabled()`, `flushBanglaBuffer()` |
| Dictionary | `setDictionaryWords()`, `getDictionaryWords()`, `removeDictionaryWord()` |
| Clipboard | `getClipboardHistory()`, `clearClipboardHistory()`, `removeClipboardItem()` |
| Emoji | `getRecentEmojis()`, `recordEmojiUsed()` |
| Preferences | `getPreferences()`, `savePreferences()` |

## Key conventions

- **Strict TypeScript** — `tsconfig.json` uses `"strict": true`. Keep 0 errors.
- **Expo Router** — File-based routing in `app/`. `_layout.tsx` files define navigators.
- **Zustand** — Global state management with AsyncStorage persistence (`persist` middleware).
- **Keyboard bundle is isolated** — `keyboard.index.js` (entry) must NOT import from `app/` or companion code. It renders the `KeyboardScreen` component.
- **React.memo + useCallback** — Used extensively on `Key`, `KeyRow`, `SuggestionBar` for performance.
- **Hermes JS engine** — Enabled via `app.json`.
- **Haptic feedback** — Uses `VIBRATE` permission.
- **Theme system** — `Theme` interface in `src/keyboard/types.ts`, presets in `constants/Themes.ts`, persisted in Zustand.
- **Sound feedback** — Uses `AudioManager.playSoundEffect()`.

## Notable constraints

- **Android only** — No iOS support. `app.json` sets `"platforms": ["android"]`.
- **Min SDK 26** — `app.json` sets `minSdkVersion: 26`.
- **Target SDK 34** — Android 14 target.
- **Keyboard bundle ~911 KB** — Keep it lean.
- **Dictionary files** — Must compile `.txt` → `.bin` via `scripts/compile_dictionaries.py` before building.
- **No global package installs** — Don't use `npm install -g`.
- **Blocked permissions** — READ_CONTACTS, ACCESS_FINE_LOCATION, RECORD_AUDIO are explicitly blocked.

## Architecture

- Companion app (Expo Router/RCT) and keyboard UI (`:ime_process`) run in the **same APK** but **separate React hosts**.
- `useSettingsSync` hook writes Zustand state → SharedPreferences with 300ms debounce.
- The keyboard bundle's `KeyboardScreen` reads preferences from SharedPreferences directly.
- Suggestion engine uses binary Trie (prefix + Levenshtein fuzzy search) with 50ms debounce on background thread.
- Clipboard capture happens in `onStartInputView()` (the only Android-sanctioned moment on 10+).
- Password fields automatically suppress suggestions and clipboard capture.
