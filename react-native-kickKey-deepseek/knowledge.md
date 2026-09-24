# Project knowledge

This file gives Freebuff context about your project: goals, commands, conventions, and gotchas.

## What this is

**KickKey** — An Android custom keyboard app built with React Native + Expo SDK 57. Written in TypeScript (frontend/companion app) and Kotlin (IME service, native modules). Android-only (Expo config sets `"platforms": ["android"]`).

The app has **two separate React Native bundles** loaded into the same process:
1. **Keyboard bundle** — Entry: `keyboard.index.js`. Registers `KickKeyKeyboard` component. Runs inside `:ime_process` via `KickKeyInputMethodService.kt`. Must NOT import from the companion app.
2. **Companion app** — Entry: `expo-router/entry` (`src/app` directory). Runs 5-tab layout + 3-step onboarding wizard under the `mainApp` route segment. Uses Expo Router.

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
src/                         # ALL app source code (tsconfig alias @/* → src/*)
  app/                       # Expo Router routes (reads src/app natively)
    mainApp/                 # Main-app segment: (tabs) + onboarding + shared UI components
      (tabs)/                # Tab navigation: Home, Settings, Themes, Language, Dictionary
        index.tsx            # Home tab (live setup status + try-it text field)
        settings.tsx         # Haptic/sound/autocorrect toggles
        themes.tsx           # Dark/Light/AMOLED + key height/radius/font sliders
        language.tsx         # English/Bangla selector
        dictionary.tsx       # Custom word list editor
        _layout.tsx          # Tab navigator layout
      onboarding/            # 3-step wizard (enable → set default → done)
      KeyboardTabBar.tsx, LanguageTag.tsx, OnboardingIcons.tsx,
      SetupProgress.tsx, ThemeCard.tsx, ToggleRow.tsx   # Shared UI components
      _layout.tsx            # mainApp segment layout (Stack)
    _layout.tsx              # Root layout (onboarding vs mainApp)
    index.tsx                # Root redirect → /mainApp

  constants/Themes.ts        # Theme color definitions

  hooks/
    useKickKeyBridge.ts      # Bridge calls to native module
    useSettingsSync.ts       # Zustand → SharedPreferences sync
    useSetupStatus.ts        # Polls keyboard enable/default status
    useKeyboardState.ts      # State + native wiring for the keyboard bundle
    useKeyboardTheme.ts      # Keyboard theme colors from SharedPreferences

    mainKeyboard/            # Keyboard bundle code (loaded in :ime_process)
                             # ⚠ imports only relative paths — built by plain Metro
                             #   (keyboard.index.js at repo root), no @/ alias support
      KeyboardScreen.tsx     # Root keyboard component (ErrorBoundary + QykeyKeyboard)
      ErrorBoundary.tsx      # Catches JS errors and shows them on-screen
      FloatingPanel.tsx      # FloatingPanel (a11y surface)
      Key.tsx                # Chocolate key component
      keyboard/              # "Chocolate bar" UI ported from the qykey reference
        QykeyKeyboard.tsx    # Orchestrator (slider, top keys, arrows, main keys, emoji, touchpad)
        styles.ts            # Chocolate neumorphic styles (exact qykey look)
        MainKeys.tsx         # Letter rows / bottom row
        KeyboardSlider.tsx   # Keyboard ⇄ touchpad toggle
        KeyboardTopKeys.tsx  # Emoji / suggestions / SYM / mic strip
        SymbolKeys.tsx, SymbolKeysMore.tsx  # Symbol + system-key pages (F-keys)
        EmojiBoard.tsx       # Emoji picker
        FeatheredArrowKey.tsx  # Arrow glyphs
        speechRecognition.ts # Mic bridge → real expo-speech-recognition module
        MicrophoneIcon.tsx   # FontAwesome5 "microphone" glyph (react-native-svg)
        emojiData.ts         # Self-contained emoji categories and glyph data
      touchpad/              # Touchpad (mouse-mode surface) + PointerRoot (system pointer)
          config.ts          # Wire colors, cell size, glow speed

  data/soundManager.ts       # Optional key-click sound (shared, no @/ imports inside)

  store/settingsStore.ts     # Zustand store with AsyncStorage persistence

modules/kickkey-module/      # Native module bridge (TypeScript side)
  index.ts                   # All native functions exposed to JS
                             # (Kotlin impl lives in native/java/com/kickkey/)

native/                      # Kotlin sources + res copied into android/ by config plugins
  java/com/kickkey/*.kt      # IME service, a11y service, module, engines
  res/xml/*.xml              # method.xml, accessibility_service_config.xml
  proguard-rules.pro

plugins/                     # Expo config plugins
  withImeService.js          # Copies native/ into android/, registers IME service
  withKeyboardBundle.js      # Configures separate keyboard bundle

scripts/compile_dictionaries.py  # Python script to build binary Trie files

docs/                        # Non-essential docs (FAQ, privacy-policy, todo, issues)

assets/dictionaries/         # Word list files and compiled binary Tries
  english.txt, english.bin   # English dictionary (~17 KB)
  bangla.txt, bangla.bin     # Bangla dictionary (~13 KB)
```

## Native module functions

Defined in `modules/kickkey-module/index.ts` — calls through to `KickKey` NativeModule (Kotlin):

| Category | Functions |
|---|---|
| Setup | `isDefaultKeyboard()`, `isKeyboardEnabled()`, `openKeyboardSettings()` |
| Input | `commitKey()`, `sendBackspace()`, `commitSpace()`, `sendEnter()`, `commitText()` (voice transcript) |
| Suggestions | `commitSuggestion()`, `setBanglaEnabled()`, `flushBanglaBuffer()` |
| Dictionary | `setDictionaryWords()`, `getDictionaryWords()`, `removeDictionaryWord()` |
| Clipboard | `getClipboardHistory()`, `clearClipboardHistory()`, `removeClipboardItem()` |
| Emoji | `getRecentEmojis()`, `recordEmojiUsed()` |
| Preferences | `getPreferences()`, `savePreferences()` |

## Key conventions

- **Strict TypeScript** — `tsconfig.json` uses `"strict": true`. Keep 0 errors.
- **Expo Router** — File-based routing in `src/app/` (official `src/app` convention; `src/app` wins if a root `app/` also exists). `_layout.tsx` files define navigators.
- **Import aliases** — `@/*` → `src/*` and `@assets/*` → `assets/*` (tsconfig `paths`; Metro resolves them because `experiments.tsconfigPaths` defaults to on in SDK 57). App-side code uses aliases; keyboard code stays relative.
- **Zustand** — Global state management with AsyncStorage persistence (`persist` middleware).
- **Keyboard bundle is isolated** — `keyboard.index.js` (repo-root entry) must NOT import from `src/app` or companion code. It renders the `KeyboardScreen` component. Keyboard code uses relative imports only (plain-Metro build has no tsconfig-paths resolution).
- **React.memo + useCallback** — Used extensively on `Key` and the circuit components for performance.
- **Hermes JS engine** — Enabled via `app.json`.
- **Haptic feedback** — Uses `VIBRATE` permission.
- **Fixed light look** — The qykey "chocolate bar" UI replaced the old theme system; no dark mode.
- **Sound feedback** — Uses `AudioManager.playSoundEffect()`.

## Notable constraints

- **Android only** — No iOS support. `app.json` sets `"platforms": ["android"]`.
- **Min SDK 26** — `app.json` sets `minSdkVersion: 26`.
- **Target SDK 34** — Android 14 target.
- **Keyboard bundle ~2.5 MB** — Includes react-native-svg + react-native-reanimated/worklets (circuit + emoji data) + expo-modules-core (voice). Keep it as lean as features allow.
- **Dictionary files** — Must compile `.txt` → `.bin` via `scripts/compile_dictionaries.py` before building.
- **No global package installs** — Don't use `npm install -g`.
- **Blocked permissions** — READ_CONTACTS and ACCESS_FINE_LOCATION are blocked; RECORD_AUDIO is allowed (needed for voice typing). The keyboard runs in `:ime_process` with no Activity, so the RECORD_AUDIO prompt is requested once from the companion app (`src/app/_layout.tsx`); the IME then starts recognition via expo-speech-recognition (autolinked TurboModule, same path as svg/reanimated).
- **reanimated needs babel plugin** — `babel.config.js` adds `react-native-worklets/plugin` (required by reanimated 4 for the circuit animation). Both bundles share this config.

## Architecture

- Companion app (Expo Router/RCT) and keyboard UI (`:ime_process`) run in the **same APK** but **separate React hosts**.
- **Native source of truth** — Kotlin lives in `native/java/com/kickkey/` and is copied into `android/` by `plugins/withImeService.js` on prebuild; `android/` itself is generated and gitignored.
- `useSettingsSync` hook writes Zustand state → SharedPreferences with 300ms debounce.
- The keyboard bundle's `KeyboardScreen` reads preferences from SharedPreferences directly.
- Suggestion engine uses binary Trie (prefix + Levenshtein fuzzy search) with 50ms debounce on background thread.
- Clipboard capture happens in `onStartInputView()` (the only Android-sanctioned moment on 10+).
- Password fields automatically suppress suggestions and clipboard capture.
