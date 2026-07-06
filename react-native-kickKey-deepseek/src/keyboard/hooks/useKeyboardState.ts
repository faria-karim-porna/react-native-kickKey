import { useState, useCallback, useEffect, useRef } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import type { KeyDef } from '../types';

const { KickKey } = NativeModules;
const emitter = new NativeEventEmitter(KickKey);

export interface KeyboardState {
  language: 'en' | 'bn';
  isShift: boolean;
  isCapsLock: boolean;
  isSymbol: boolean;
  isEmoji: boolean;
  isClipboard: boolean;
  suggestions: string[];
  handleKeyPress: (key: KeyDef) => void;
  handleBackspace: () => void;
  handleBackspaceLongPress: () => void;
  handleBackspaceLongPressEnd: () => void;
  handleSpace: () => void;
  handleEnter: () => void;
  handleShift: () => void;
  handleLanguageSwitch: () => void;
  handleSymbolToggle: () => void;
  handleEmojiToggle: () => void;
  handleClipboardToggle: () => void;
  handleSuggestionSelect: (word: string) => void;
}

export function useKeyboardState(): KeyboardState {
  const [language, setLanguage]       = useState<'en' | 'bn'>('en');
  const [isShift, setIsShift]         = useState(false);
  const [isCapsLock, setIsCapsLock]   = useState(false);
  const [isSymbol, setIsSymbol]       = useState(false);
  const [isEmoji, setIsEmoji]         = useState(false);
  const [isClipboard, setIsClipboard] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Hold ref for long-press backspace interval
  const backspacePressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Native event listeners ───────────────────────────────────────────────

  useEffect(() => {
    // Phase 4 will populate suggestions; for now just wire the listener
    const subSuggestions = emitter.addListener('onSuggestionsUpdated', (data) => {
      setSuggestions(data.suggestions ?? []);
    });

    // Adapt keyboard to field type when a new input starts
    const subInput = emitter.addListener('onInputStarted', (data) => {
      const inputType: number = data.inputType ?? 0;
      const isPasswordField = (inputType & 0x80) !== 0;   // TYPE_TEXT_VARIATION_PASSWORD
      if (isPasswordField) setSuggestions([]);
      // Reset symbol / emoji mode on new field focus
      setIsSymbol(false);
      setIsEmoji(false);
      setIsClipboard(false);
    });

    // Release heavy panels when keyboard hides (Phase 6 fully uses this)
    const subHidden = emitter.addListener('onKeyboardHidden', () => {
      setIsEmoji(false);
      setIsClipboard(false);
    });

    return () => {
      subSuggestions.remove();
      subInput.remove();
      subHidden.remove();
    };
  }, []);

  // Clean up long-press interval on unmount
  useEffect(() => {
    return () => {
      if (backspacePressRef.current) clearInterval(backspacePressRef.current);
    };
  }, []);

  // ── Key press handlers ───────────────────────────────────────────────────

  const handleKeyPress = useCallback((key: KeyDef) => {
    if (!key.code) return;  // action-only keys handled by their own handlers

    KickKey.commitKey(key.code, language);

    // Auto-reset shift after a single character (not caps lock)
    if (isShift && !isCapsLock) {
      setIsShift(false);
    }
  }, [language, isShift, isCapsLock]);

  const handleBackspace = useCallback(() => {
    KickKey.sendBackspace();
  }, []);

  /**
   * Long-press backspace: keep deleting every 80ms while finger is held.
   * Call handleBackspaceLongPressEnd() when the finger lifts.
   */
  const handleBackspaceLongPress = useCallback(() => {
    if (backspacePressRef.current) return;
    backspacePressRef.current = setInterval(() => {
      KickKey.sendBackspace();
    }, 80);
  }, []);

  const handleBackspaceLongPressEnd = useCallback(() => {
    if (backspacePressRef.current) {
      clearInterval(backspacePressRef.current);
      backspacePressRef.current = null;
    }
  }, []);

  const handleSpace = useCallback(() => {
    KickKey.commitSpace();
    if (isShift && !isCapsLock) setIsShift(false);
  }, [isShift, isCapsLock]);

  const handleEnter = useCallback(() => {
    KickKey.sendEnter();
  }, []);

  /**
   * Shift state machine:
   *   off → shift (one letter) → caps lock (stay on) → off
   */
  const handleShift = useCallback(() => {
    if (!isShift && !isCapsLock) {
      setIsShift(true);
    } else if (isShift && !isCapsLock) {
      setIsCapsLock(true);
    } else {
      setIsShift(false);
      setIsCapsLock(false);
    }
  }, [isShift, isCapsLock]);

  const handleLanguageSwitch = useCallback(() => {
    setLanguage(l => l === 'en' ? 'bn' : 'en');
    setSuggestions([]);
    setIsShift(false);
    setIsCapsLock(false);
  }, []);

  const handleSymbolToggle = useCallback(() => {
    setIsSymbol(s => !s);
    setIsShift(false);
    setIsCapsLock(false);
  }, []);

  const handleEmojiToggle = useCallback(() => {
    setIsEmoji(e => !e);
    setIsClipboard(false);
  }, []);

  const handleClipboardToggle = useCallback(() => {
    setIsClipboard(c => !c);
    setIsEmoji(false);
  }, []);

  const handleSuggestionSelect = useCallback((word: string) => {
    // Phase 4 wires this to KickKey.commitSuggestion(); for now commit as text
    KickKey.commitKey(word, language);
    setSuggestions([]);
  }, [language]);

  return {
    language, isShift, isCapsLock, isSymbol, isEmoji, isClipboard, suggestions,
    handleKeyPress,
    handleBackspace,
    handleBackspaceLongPress,
    handleBackspaceLongPressEnd,
    handleSpace,
    handleEnter,
    handleShift,
    handleLanguageSwitch,
    handleSymbolToggle,
    handleEmojiToggle,
    handleClipboardToggle,
    handleSuggestionSelect,
  };
}
