// ============================================================
// useKeyboardState.ts — state + native wiring for the qykey-style
// keyboard (en-US / bn-BD / banglish).
//
// Every key press commits through the native QyKey module:
//   - commitKey(code, 'en')  → direct commit (en-US, bn-BD glyphs)
//   - commitKey(code, 'bn')  → native Avro-style phonetic engine
//                              (banglish mode)
// Suggestions arrive from the native engine via onSuggestionsUpdated.
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { playKeySound } from '../data/soundManager';
import type { AppLanguage } from '../types/keyboard';

/** PC-style modifier keys that can be latched with a tap (Ctrl/Alt/Win/Shift). */
export type ModifierKey = 'ctrl' | 'alt' | 'meta' | 'shift';

/** Named keys that participate in PC-style combos (Ctrl + key, Alt + key, …). */
const COMBOABLE_KEYS = new Set<string>([
  'tab', 'esc', 'escape', 'enter', 'return', 'space',
  'left', 'right', 'up', 'down',
  'del', 'delete', 'backspace', 'home', 'end', 'pageup', 'pagedown', 'insert',
  ...Array.from({ length: 12 }, (_, i) => `f${i + 1}`),
]);

// Lazy-init — avoids crash at module scope if QyKey is not yet available
let _QyKey: any = null;
let _emitter: any = null;

function getQyKey() {
  if (!_QyKey) _QyKey = NativeModules.QyKey;
  return _QyKey;
}

function getEmitter() {
  if (!_emitter) {
    try {
      _emitter = new NativeEventEmitter(getQyKey());
    } catch (e) {
      console.warn('[QyKey] NativeEventEmitter init failed:', e);
      // Return a stub emitter that does nothing
      _emitter = { addListener: () => ({ remove: () => {} }), removeListeners: () => {} };
    }
  }
  return _emitter;
}

export interface KeyboardState {
  language: AppLanguage;
  toggleMode: boolean;
  symbolModeStatus: 0 | 1 | 2;
  isEmojiMode: boolean;
  suggestions: string[];
  setToggleMode: (v: boolean) => void;
  handleKeyPress: (code: string) => void;
  handleBackspace: () => void;
  handleBackspaceRepeatStart: () => void;
  handleBackspaceRepeatEnd: () => void;
  handleSpace: () => void;
  handleEnter: () => void;
  handleSpecialKey: (key: string) => void;
  // ── PC-style modifiers (one-shot latch, Shift double-tap = caps lock) ─────
  heldModifiers: ModifierKey[];
  shiftActive: boolean;
  capsLockOn: boolean;
  toggleHeldModifier: (key: ModifierKey) => void;
  handleShiftPress: () => void;
  handleMoveCursor: (direction: 'left' | 'right' | 'up' | 'down') => void;
  handleLanguageChange: (lang: AppLanguage) => void;
  handleSymbolToggle: () => void;
  handleSymbolNext: () => void;
  handleSymbolPrev: () => void;
  handleEmojiToggle: () => void;
  handleEmojiSelect: (emoji: string) => void;
  handleSuggestionSelect: (word: string) => void;
  handleTranscriptComplete: (text: string) => void;
  // ── Touchpad ──────────────────────────────────────────────────────────────
  handleScrollPage: (direction: 'up' | 'down') => void;
  handleScrollRepeatStart: (direction: 'up' | 'down') => void;
  handleScrollRepeatEnd: () => void;
  handleNavigateHistory: (direction: 'backward' | 'forward') => Promise<boolean>;
  handleMouseClick: (button: 'left' | 'right') => void;
  handleDragStart: () => void;
  handleDragEnd: () => void;
  tapToClick: boolean;
  // ── Touchpad: on-screen pointer overlay ──────────────────────────────────
  handlePointerShow: () => Promise<boolean>;
  handlePointerHide: () => void;
  handlePointerMove: (dx: number, dy: number) => void;
  handleRequestPointerPermission: () => void;
}

/** banglish types Roman letters → native phonetic engine converts to Bangla. */
function nativeLanguageFor(lang: AppLanguage): 'en' | 'bn' {
  return lang === 'banglish' ? 'bn' : 'en';
}

export function useKeyboardState(): KeyboardState {
  const [language, setLanguage]         = useState<AppLanguage>('en-US');
  const [toggleMode, setToggleMode]     = useState(false);
  const [symbolModeStatus, setSymbolModeStatus] = useState<0 | 1 | 2>(0);
  const [isEmojiMode, setIsEmojiMode]   = useState(false);
  const [suggestions, setSuggestions]   = useState<string[]>([]);

  const backspaceRepeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backspaceDelayRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRepeatDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRepeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tapToClick, setTapToClick] = useState(true);

  // ── PC-style modifier latch state ──────────────────────────────────────────
  // One-shot latched modifiers (Ctrl/Alt/Win/Shift): tap the modifier (its key
  // lights up), then the next key is sent as a real combo (Ctrl+C, Alt+Tab…)
  // and the latch clears — mirroring "hold the modifier while pressing" on a
  // physical keyboard. Double-tapping Shift toggles caps lock instead.
  const [heldModifiers, setHeldModifiers] = useState<ModifierKey[]>([]);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const lastShiftTapRef = useRef<number>(0);

  useEffect(() => {
    getQyKey()
      ?.getPreferences()
      ?.then((prefs: any) => {
        if (prefs && typeof prefs.tapToClick === 'boolean') {
          setTapToClick(prefs.tapToClick);
        }
      })
      .catch(() => {});
  }, []);

  // ── Touchpad: on-screen pointer overlay ──────────────────────────────────

  /**
   * Shows the desktop-style pointer over the app screen. Resolves true when
   * visible, false when "Display over other apps" is not granted.
   */
  const handlePointerShow = useCallback((): Promise<boolean> => {
    const res = getQyKey()?.pointerShow?.();
    return res && typeof res.then === 'function' ? res : Promise.resolve(false);
  }, []);

  /** Hides the on-screen mouse pointer overlay. */
  const handlePointerHide = useCallback(() => {
    getQyKey()?.pointerHide?.();
  }, []);

  /** Moves the pointer by a relative (dx, dy) delta while the user drags. */
  const handlePointerMove = useCallback((dx: number, dy: number) => {
    getQyKey()?.pointerMove?.(dx, dy);
  }, []);

  /** Opens the system "Display over other apps" settings for this app. */
  const handleRequestPointerPermission = useCallback(() => {
    getQyKey()?.openOverlaySettings?.();
  }, []);

  // ── Touchpad: IME strip mode & pointer overlay ───────────────────────────
  useEffect(() => {
    getQyKey()?.setTouchpadMode?.(toggleMode);
    if (toggleMode) {
      handlePointerShow();
    } else {
      handlePointerHide();
    }
  }, [toggleMode, handlePointerShow, handlePointerHide]);

  // ── Native event listeners ───────────────────────────────────────────────

  useEffect(() => {
    const emitter = getEmitter();

    const subSuggestions = emitter.addListener('onSuggestionsUpdated', (data: any) => {
      setSuggestions(data.suggestions ?? []);
    });

    // A new input field started — reset transient UI modes
    const subInput = emitter.addListener('onInputStarted', () => {
      setSymbolModeStatus(0);
      setIsEmojiMode(false);
      setSuggestions([]);
      setToggleMode(false);
      // Clear latched modifiers on a new field (caps lock persists, PC-like).
      setHeldModifiers([]);
      getQyKey()?.pointerHide?.();
    });

    return () => {
      subSuggestions.remove();
      subInput.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (backspaceDelayRef.current) clearTimeout(backspaceDelayRef.current);
      if (backspaceRepeatRef.current) clearInterval(backspaceRepeatRef.current);
      if (scrollRepeatDelayRef.current) clearTimeout(scrollRepeatDelayRef.current);
      if (scrollRepeatRef.current) clearInterval(scrollRepeatRef.current);
    };
  }, []);

  // ── Key presses ──────────────────────────────────────────────────────────

  const handleKeyPress = useCallback((code: string) => {
    if (!code) return;
    if (heldModifiers.length > 0) {
      // PC-style combo: Ctrl+C, Alt+1, Shift+A … via real key events with meta
      // state, so apps (and remote-desktop hosts) treat them as combos. Shift
      // stays in the meta set: it is what makes the target app type the
      // uppercase letter / shifted symbol (Shift+1 → '!').
      const comboKey =
        heldModifiers.includes('shift') && code.length === 1 ? code.toUpperCase() : code;
      getQyKey()?.sendKeyCombo(heldModifiers.join(','), comboKey);
      setHeldModifiers([]);
      playKeySound();
      return;
    }
    const effective = capsLockOn && code.length === 1 ? code.toUpperCase() : code;
    getQyKey()?.commitKey(effective, nativeLanguageFor(language));
    playKeySound();
  }, [language, heldModifiers, capsLockOn]);

  const handleBackspace = useCallback(() => {
    const comboMods = heldModifiers.filter((m) => m !== 'shift');
    if (comboMods.length > 0) {
      // Ctrl+Backspace = delete previous word (PC behavior).
      getQyKey()?.sendKeyCombo(comboMods.join(','), 'backspace');
      setHeldModifiers([]);
    } else {
      getQyKey()?.sendBackspace();
    }
    playKeySound();
  }, [heldModifiers]);

  const handleBackspaceRepeatStart = useCallback(() => {
    if (backspaceRepeatRef.current || backspaceDelayRef.current) return;
    // Small delay before the auto-repeat kicks in
    backspaceDelayRef.current = setTimeout(() => {
      backspaceDelayRef.current = null;
      backspaceRepeatRef.current = setInterval(async () => {
        const result = getQyKey()?.sendBackspace();
        // If sendBackspace returns a Promise, await it and check the result.
        // If it returns nothing (undefined / non-thenable), we can't tell —
        // but we still fire the sound. Either way, if the native side signals
        // "nothing deleted" (false), stop the repeat immediately.
        if (result && typeof result.then === 'function') {
          const deleted: boolean = await result;
          if (!deleted) {
            handleBackspaceRepeatEnd();
          }
        }
      }, 80);
    }, 350);
  }, []);

  const handleBackspaceRepeatEnd = useCallback(() => {
    if (backspaceDelayRef.current) {
      clearTimeout(backspaceDelayRef.current);
      backspaceDelayRef.current = null;
    }
    if (backspaceRepeatRef.current) {
      clearInterval(backspaceRepeatRef.current);
      backspaceRepeatRef.current = null;
    }
  }, []);

  const handleSpace = useCallback(() => {
    const comboMods = heldModifiers.filter((m) => m !== 'shift');
    if (comboMods.length > 0) {
      getQyKey()?.sendKeyCombo(comboMods.join(','), 'space');
      setHeldModifiers([]);
    } else {
      getQyKey()?.commitSpace();
    }
    playKeySound();
  }, [heldModifiers]);

  const handleEnter = useCallback(() => {
    const comboMods = heldModifiers.filter((m) => m !== 'shift');
    if (comboMods.length > 0) {
      getQyKey()?.sendKeyCombo(comboMods.join(','), 'enter');
      setHeldModifiers([]);
    } else {
      getQyKey()?.sendEnter();
    }
    playKeySound();
  }, [heldModifiers]);

  const handleSpecialKey = useCallback((key: string) => {
    if (!key) return;
    const comboMods = heldModifiers.filter((m) => m !== 'shift');
    if (comboMods.length > 0 && COMBOABLE_KEYS.has(key.toLowerCase())) {
      // e.g. Alt+Tab, Ctrl+F5 — send as a real combo and consume the latch.
      getQyKey()?.sendKeyCombo(comboMods.join(','), key);
      setHeldModifiers([]);
    } else {
      getQyKey()?.sendSpecialKey(key);
    }
    playKeySound();
  }, [heldModifiers]);

  const handleMoveCursor = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    const comboMods = heldModifiers.filter((m) => m !== 'shift');
    if (comboMods.length > 0) {
      // Ctrl+←/→ = word jump (PC behavior).
      getQyKey()?.sendKeyCombo(comboMods.join(','), direction);
      setHeldModifiers([]);
    } else {
      getQyKey()?.moveCursor(direction);
    }
    playKeySound();
  }, [heldModifiers]);

  // ── PC-style modifiers: one-shot latch (+ Shift double-tap = caps lock) ────

  /** Toggles a latched modifier (Ctrl / Alt / Win). Tap again to unlatch. */
  const toggleHeldModifier = useCallback((key: ModifierKey) => {
    setHeldModifiers((mods) =>
      mods.includes(key) ? mods.filter((m) => m !== key) : [...mods, key],
    );
    playKeySound();
  }, []);

  /**
   * Shift, PC-style: single tap = one-shot (next letter capitalized, then it
   * auto-releases); double tap = caps lock until tapped again.
   */
  const handleShiftPress = useCallback(() => {
    const now = Date.now();
    const isDoubleTap = now - lastShiftTapRef.current < 350;
    lastShiftTapRef.current = now;
    if (isDoubleTap) {
      // Double tap → toggle caps lock (a latched one-shot shift clears).
      setCapsLockOn((on) => !on);
      setHeldModifiers((mods) => mods.filter((m) => m !== 'shift'));
      playKeySound();
      return;
    }
    if (capsLockOn) {
      // Already locked: a single tap releases the lock.
      setCapsLockOn(false);
    } else if (heldModifiers.includes('shift')) {
      // Latched: a second single tap unlatches.
      setHeldModifiers((mods) => mods.filter((m) => m !== 'shift'));
    } else {
      setHeldModifiers((mods) => [...mods, 'shift']);
    }
    playKeySound();
  }, [capsLockOn, heldModifiers]);

  // ── Mode switches ────────────────────────────────────────────────────────

  const handleLanguageChange = useCallback((lang: AppLanguage) => {
    if (lang === language) return;
    // Flush any pending phonetic buffer before leaving banglish
    getQyKey()?.flushBanglaBuffer().catch(() => {});
    setLanguage(lang);
    setSuggestions([]);
  }, [language]);

  const handleSymbolToggle = useCallback(() => {
    if (language === 'banglish') getQyKey()?.flushBanglaBuffer().catch(() => {});
    setSymbolModeStatus((s) => (s === 0 ? 1 : 0));
    setIsEmojiMode(false);
    setSuggestions([]);
  }, [language]);

  const handleSymbolNext = useCallback(() => {
    setSymbolModeStatus(2);
  }, []);

  const handleSymbolPrev = useCallback(() => {
    setSymbolModeStatus(1);
  }, []);

  const handleEmojiToggle = useCallback(() => {
    if (language === 'banglish') getQyKey()?.flushBanglaBuffer().catch(() => {});
    setIsEmojiMode((e) => !e);
    setSymbolModeStatus(0);
    setSuggestions([]);
  }, [language]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    getQyKey()?.commitKey(emoji, 'en');
    getQyKey()?.recordEmojiUsed(emoji);
    playKeySound();
  }, []);

  const handleSuggestionSelect = useCallback((word: string) => {
    getQyKey()?.commitSuggestion(word);
    playKeySound();
    setSuggestions([]);
  }, []);

  /** Voice dictation: commit the recognized transcript through the native IME. */
  const handleTranscriptComplete = useCallback((text: string) => {
    if (!text) return;
    getQyKey()?.commitText(text);
    playKeySound();
  }, []);

  // ── Touchpad handlers ─────────────────────────────────────────────────────

  /** Scroll the focused view / app one step up or down. */
  const handleScrollPage = useCallback((direction: 'up' | 'down') => {
    getQyKey()?.scrollPage(direction);
  }, []);

  /** Held scroll caret → auto-repeat (mirrors backspace repeat: 350ms delay, 150ms tick). */
  const handleScrollRepeatStart = useCallback((direction: 'up' | 'down') => {
    if (scrollRepeatRef.current || scrollRepeatDelayRef.current) return;
    scrollRepeatDelayRef.current = setTimeout(() => {
      scrollRepeatDelayRef.current = null;
      scrollRepeatRef.current = setInterval(() => {
        getQyKey()?.scrollPage(direction);
      }, 150);
    }, 350);
  }, []);

  const handleScrollRepeatEnd = useCallback(() => {
    if (scrollRepeatDelayRef.current) {
      clearTimeout(scrollRepeatDelayRef.current);
      scrollRepeatDelayRef.current = null;
    }
    if (scrollRepeatRef.current) {
      clearInterval(scrollRepeatRef.current);
      scrollRepeatRef.current = null;
    }
  }, []);

  /** Back/Forward. Resolves false when Forward is unsupported. */
  const handleNavigateHistory = useCallback((direction: 'backward' | 'forward') => {
    const res = getQyKey()?.navigateHistory(direction);
    return res && typeof res.then === 'function' ? res : Promise.resolve(true);
  }, []);

  /** Mouse L/R button action (native: tap / long-press under the cursor). */
  const handleMouseClick = useCallback((button: 'left' | 'right') => {
    getQyKey()?.mouseClick(button);
  }, []);

  /** L button press-in — arm a native drag at the cursor. */
  const handleDragStart = useCallback(() => {
    getQyKey()?.dragStart();
  }, []);

  /** L button press-out — dispatch the drag stroke (or a tap). */
  const handleDragEnd = useCallback(() => {
    getQyKey()?.dragEnd();
  }, []);



  return {
    language, toggleMode, symbolModeStatus, isEmojiMode, suggestions,
    setToggleMode,
    handleKeyPress, handleBackspace,
    handleBackspaceRepeatStart, handleBackspaceRepeatEnd,
    handleSpace, handleEnter, handleSpecialKey, handleMoveCursor,
    heldModifiers, shiftActive: capsLockOn || heldModifiers.includes('shift'),
    capsLockOn, toggleHeldModifier, handleShiftPress,
    handleLanguageChange,
    handleSymbolToggle, handleSymbolNext, handleSymbolPrev,
    handleEmojiToggle, handleEmojiSelect,
    handleSuggestionSelect,
    handleTranscriptComplete,
    handleScrollPage, handleScrollRepeatStart, handleScrollRepeatEnd,
    handleNavigateHistory, handleMouseClick,
    handleDragStart, handleDragEnd, tapToClick,
    handlePointerShow, handlePointerHide, handlePointerMove, handleRequestPointerPermission,
  };
}
