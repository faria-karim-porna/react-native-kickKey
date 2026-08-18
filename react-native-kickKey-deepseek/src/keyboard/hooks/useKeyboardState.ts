// ============================================================
// useKeyboardState.ts — state + native wiring for the qykey-style
// keyboard (en-US / bn-BD / banglish).
//
// Every key press commits through the native KickKey module:
//   - commitKey(code, 'en')  → direct commit (en-US, bn-BD glyphs)
//   - commitKey(code, 'bn')  → native Avro-style phonetic engine
//                              (banglish mode)
// Suggestions arrive from the native engine via onSuggestionsUpdated.
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { playKeySound } from '../data/soundManager';
import type { AppLanguage } from '../qykey/QykeyKeyboard';

// Lazy-init — avoids crash at module scope if KickKey is not yet available
let _KickKey: any = null;
let _emitter: any = null;

function getKickKey() {
  if (!_KickKey) _KickKey = NativeModules.KickKey;
  return _KickKey;
}

function getEmitter() {
  if (!_emitter) {
    try {
      _emitter = new NativeEventEmitter(getKickKey());
    } catch (e) {
      console.warn('[KickKey] NativeEventEmitter init failed:', e);
      // Return a stub emitter that does nothing
      _emitter = { addListener: () => ({ remove: () => {} }), removeListeners: () => {} };
    }
  }
  return _emitter;
}

export interface QykeyKeyboardState {
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

export function useKeyboardState(): QykeyKeyboardState {
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

  useEffect(() => {
    getKickKey()
      ?.getPreferences()
      ?.then((prefs: any) => {
        if (prefs && typeof prefs.tapToClick === 'boolean') {
          setTapToClick(prefs.tapToClick);
        }
      })
      .catch(() => {});
  }, []);

  // ── Touchpad: IME strip mode (M3) ──────────────────────────────────────
  // Native shrinks the IME window to a thin strip so the pointer has the
  // whole screen (no-op when the panel is open / IME hidden).
  useEffect(() => {
    getKickKey()?.setTouchpadMode?.(toggleMode);
  }, [toggleMode]);

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
    getKickKey()?.commitKey(code, nativeLanguageFor(language));
    playKeySound();
  }, [language]);

  const handleBackspace = useCallback(() => {
    getKickKey()?.sendBackspace();
    playKeySound();
  }, []);

  const handleBackspaceRepeatStart = useCallback(() => {
    if (backspaceRepeatRef.current || backspaceDelayRef.current) return;
    // Small delay before the auto-repeat kicks in
    backspaceDelayRef.current = setTimeout(() => {
      backspaceDelayRef.current = null;
      backspaceRepeatRef.current = setInterval(async () => {
        const result = getKickKey()?.sendBackspace();
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
    getKickKey()?.commitSpace();
    playKeySound();
  }, []);

  const handleEnter = useCallback(() => {
    getKickKey()?.sendEnter();
    playKeySound();
  }, []);

  // ── Mode switches ────────────────────────────────────────────────────────

  const handleLanguageChange = useCallback((lang: AppLanguage) => {
    if (lang === language) return;
    // Flush any pending phonetic buffer before leaving banglish
    getKickKey()?.flushBanglaBuffer().catch(() => {});
    setLanguage(lang);
    setSuggestions([]);
  }, [language]);

  const handleSymbolToggle = useCallback(() => {
    if (language === 'banglish') getKickKey()?.flushBanglaBuffer().catch(() => {});
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
    if (language === 'banglish') getKickKey()?.flushBanglaBuffer().catch(() => {});
    setIsEmojiMode((e) => !e);
    setSymbolModeStatus(0);
    setSuggestions([]);
  }, [language]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    getKickKey()?.commitKey(emoji, 'en');
    getKickKey()?.recordEmojiUsed(emoji);
    playKeySound();
  }, []);

  const handleSuggestionSelect = useCallback((word: string) => {
    getKickKey()?.commitSuggestion(word);
    playKeySound();
    setSuggestions([]);
  }, []);

  /** Voice dictation: commit the recognized transcript through the native IME. */
  const handleTranscriptComplete = useCallback((text: string) => {
    if (!text) return;
    getKickKey()?.commitText(text);
    playKeySound();
  }, []);

  // ── Touchpad handlers ─────────────────────────────────────────────────────

  /** Scroll the focused view / app one step up or down. */
  const handleScrollPage = useCallback((direction: 'up' | 'down') => {
    getKickKey()?.scrollPage(direction);
  }, []);

  /** Held scroll caret → auto-repeat (mirrors backspace repeat: 350ms delay, 150ms tick). */
  const handleScrollRepeatStart = useCallback((direction: 'up' | 'down') => {
    if (scrollRepeatRef.current || scrollRepeatDelayRef.current) return;
    scrollRepeatDelayRef.current = setTimeout(() => {
      scrollRepeatDelayRef.current = null;
      scrollRepeatRef.current = setInterval(() => {
        getKickKey()?.scrollPage(direction);
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
    const res = getKickKey()?.navigateHistory(direction);
    return res && typeof res.then === 'function' ? res : Promise.resolve(true);
  }, []);

  /** Mouse L/R button action (native: tap / long-press under the cursor). */
  const handleMouseClick = useCallback((button: 'left' | 'right') => {
    getKickKey()?.mouseClick(button);
  }, []);

  /** L button press-in — arm a native drag at the cursor. */
  const handleDragStart = useCallback(() => {
    getKickKey()?.dragStart();
  }, []);

  /** L button press-out — dispatch the drag stroke (or a tap). */
  const handleDragEnd = useCallback(() => {
    getKickKey()?.dragEnd();
  }, []);

  // ── Touchpad: on-screen pointer overlay ──────────────────────────────────

  /**
   * Shows the desktop-style pointer over the app screen. Resolves true when
   * visible, false when "Display over other apps" is not granted.
   */
  const handlePointerShow = useCallback((): Promise<boolean> => {
    const res = getKickKey()?.pointerShow?.();
    return res && typeof res.then === 'function' ? res : Promise.resolve(false);
  }, []);

  /** Hides the on-screen mouse pointer overlay. */
  const handlePointerHide = useCallback(() => {
    getKickKey()?.pointerHide?.();
  }, []);

  /** Moves the pointer by a relative (dx, dy) delta while the user drags. */
  const handlePointerMove = useCallback((dx: number, dy: number) => {
    getKickKey()?.pointerMove?.(dx, dy);
  }, []);

  /** Opens the system "Display over other apps" settings for this app. */
  const handleRequestPointerPermission = useCallback(() => {
    getKickKey()?.openOverlaySettings?.();
  }, []);

  return {
    language, toggleMode, symbolModeStatus, isEmojiMode, suggestions,
    setToggleMode,
    handleKeyPress, handleBackspace,
    handleBackspaceRepeatStart, handleBackspaceRepeatEnd,
    handleSpace, handleEnter,
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
