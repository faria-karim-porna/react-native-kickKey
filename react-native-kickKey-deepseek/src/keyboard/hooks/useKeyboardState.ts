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
  composingText: string;
  currentWord: string;             // ← NEW Phase 4
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
  const [language, setLanguage]         = useState<'en' | 'bn'>('en');
  const [isShift, setIsShift]           = useState(false);
  const [isCapsLock, setIsCapsLock]     = useState(false);
  const [isSymbol, setIsSymbol]         = useState(false);
  const [isEmoji, setIsEmoji]           = useState(false);
  const [isClipboard, setIsClipboard]   = useState(false);
  const [suggestions, setSuggestions]   = useState<string[]>([]);
  const [composingText, setComposing]   = useState('');
  const [currentWord, setCurrentWord]   = useState('');   // ← NEW Phase 4

  const backspacePressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Native event listeners ───────────────────────────────────────────────

  useEffect(() => {
    const subSuggestions = emitter.addListener('onSuggestionsUpdated', (data) => {
      setSuggestions(data.suggestions ?? []);
      setCurrentWord(data.currentWord ?? '');   // ← NEW Phase 4
    });

    const subInput = emitter.addListener('onInputStarted', (data) => {
      const inputType: number = data.inputType ?? 0;
      if ((inputType & 0x80) !== 0) setSuggestions([]);
      setIsSymbol(false);
      setIsEmoji(false);
      setIsClipboard(false);
      setComposing('');
      setCurrentWord('');                        // ← NEW Phase 4
    });

    const subHidden = emitter.addListener('onKeyboardHidden', () => {
      setIsEmoji(false);
      setIsClipboard(false);
      setComposing('');
      setCurrentWord('');                        // ← NEW Phase 4
    });

    // Kotlin engine can emit composing text for the header indicator
    const subComposing = emitter.addListener('onComposingChanged', (data) => {
      setComposing(data.text ?? '');
    });

    return () => {
      subSuggestions.remove();
      subInput.remove();
      subHidden.remove();
      subComposing.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (backspacePressRef.current) clearInterval(backspacePressRef.current);
    };
  }, []);

  // ── Key press ────────────────────────────────────────────────────────────

  const handleKeyPress = useCallback((key: KeyDef) => {
    if (!key.code) return;

    // commitKey routes through BanglaInputEngine in Kotlin when language='bn'
    KickKey.commitKey(key.code, language);

    // In English mode, reset composing immediately
    if (language === 'en') {
      setComposing('');
      if (isShift && !isCapsLock) setIsShift(false);
    }
  }, [language, isShift, isCapsLock]);

  const handleBackspace = useCallback(() => {
    KickKey.sendBackspace();
  }, []);

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
    // commitSpace flushes Bangla buffer & autocorrects (Phase 4)
    KickKey.commitSpace();
    setComposing('');
    if (language === 'en' && isShift && !isCapsLock) setIsShift(false);
  }, [language, isShift, isCapsLock]);

  const handleEnter = useCallback(() => {
    KickKey.sendEnter();
    setComposing('');
  }, []);

  const handleShift = useCallback(() => {
    if (!isShift && !isCapsLock)      { setIsShift(true); }
    else if (isShift && !isCapsLock)  { setIsCapsLock(true); }
    else                              { setIsShift(false); setIsCapsLock(false); }
  }, [isShift, isCapsLock]);

  const handleLanguageSwitch = useCallback(() => {
    KickKey.flushBanglaBuffer().catch(() => {});
    setComposing('');
    setLanguage(l => l === 'en' ? 'bn' : 'en');
    setSuggestions([]);
    setCurrentWord('');                       // ← NEW Phase 4
    setIsShift(false);
    setIsCapsLock(false);
  }, []);

  const handleSymbolToggle = useCallback(() => {
    if (language === 'bn') KickKey.flushBanglaBuffer().catch(() => {});
    setIsSymbol(s => !s);
    setIsShift(false);
    setIsCapsLock(false);
    setComposing('');
  }, [language]);

  const handleEmojiToggle = useCallback(() => {
    if (language === 'bn') KickKey.flushBanglaBuffer().catch(() => {});
    setIsEmoji(e => !e);
    setIsClipboard(false);
    setComposing('');
  }, [language]);

  const handleClipboardToggle = useCallback(() => {
    if (language === 'bn') KickKey.flushBanglaBuffer().catch(() => {});
    setIsClipboard(c => !c);
    setIsEmoji(false);
    setComposing('');
  }, [language]);

  // ── UPDATED Phase 4: commitSuggestion via native module ────────────────

  const handleSuggestionSelect = useCallback((word: string) => {
    KickKey.commitSuggestion(word);   // ← CHANGED from commitKey
    setSuggestions([]);
    setCurrentWord('');               // ← NEW Phase 4
    setComposing('');
  }, []);

  return {
    language, isShift, isCapsLock, isSymbol, isEmoji, isClipboard,
    suggestions, composingText,
    currentWord,                     // ← NEW Phase 4
    handleKeyPress, handleBackspace, handleBackspaceLongPress,
    handleBackspaceLongPressEnd,
    handleSpace, handleEnter, handleShift, handleLanguageSwitch,
    handleSymbolToggle, handleEmojiToggle, handleClipboardToggle,
    handleSuggestionSelect,
  };
}
