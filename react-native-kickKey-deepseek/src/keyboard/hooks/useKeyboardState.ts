import { useState, useCallback, useEffect, useRef } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import type { KeyDef } from '../types';
import { playKeySound } from '../data/soundManager';

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

export interface KeyboardState {
  language: 'en' | 'bn';
  isShift: boolean;
  isCapsLock: boolean;
  isSymbol: boolean;
  isEmoji: boolean;
  isClipboard: boolean;
  suggestions: string[];
  composingText: string;
  currentWord: string;
  isPassword: boolean;
  isNumber: boolean;
  isPhone: boolean;
  isUrl: boolean;
  isEmail: boolean;
  imeAction: string;
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
  const [currentWord, setCurrentWord]   = useState('');

  // ── Phase 7: Input type adaptation ────────────────────────────────────────
  const [isPassword, setIsPassword]     = useState(false);
  const [isNumber, setIsNumber]         = useState(false);
  const [isPhone, setIsPhone]           = useState(false);
  const [isUrl, setIsUrl]               = useState(false);
  const [isEmail, setIsEmail]           = useState(false);
  const [imeAction, setImeAction]       = useState<string>('return');

  const backspacePressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Native event listeners ───────────────────────────────────────────────

  useEffect(() => {
    const emitter = getEmitter();
    const subSuggestions = emitter.addListener('onSuggestionsUpdated', (data: any) => {
      setSuggestions(data.suggestions ?? []);
      setCurrentWord(data.currentWord ?? '');
    });

    const subInput = emitter.addListener('onInputStarted', (data: any) => {
      // Phase 7: populate input-type fields
      setIsPassword(data.isPassword ?? false);
      setIsNumber(data.isNumber   ?? false);
      setIsPhone(data.isPhone     ?? false);
      setIsUrl(data.isUrl         ?? false);
      setIsEmail(data.isEmail     ?? false);
      setImeAction(data.imeAction ?? 'return');

      if (data.isPassword) setSuggestions([]);
      setIsSymbol(false);
      setIsEmoji(false);
      setIsClipboard(false);
      setComposing('');
      setCurrentWord('');
    });

    const subHidden = emitter.addListener('onKeyboardHidden', () => {
      setIsEmoji(false);
      setIsClipboard(false);
      setComposing('');
      setCurrentWord('');
    });

    const subComposing = emitter.addListener('onComposingChanged', (data: any) => {
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

    const KickKey = getKickKey();
    KickKey?.commitKey(key.code, language);
    playKeySound();

    if (language === 'en') {
      setComposing('');
      if (isShift && !isCapsLock) setIsShift(false);
    }
  }, [language, isShift, isCapsLock]);

  const handleBackspace = useCallback(() => {
    getKickKey()?.sendBackspace();
    playKeySound();
  }, []);

  const handleBackspaceLongPress = useCallback(() => {
    if (backspacePressRef.current) return;
    backspacePressRef.current = setInterval(() => {
      getKickKey()?.sendBackspace();
    }, 80);
  }, []);

  const handleBackspaceLongPressEnd = useCallback(() => {
    if (backspacePressRef.current) {
      clearInterval(backspacePressRef.current);
      backspacePressRef.current = null;
    }
  }, []);

  const handleSpace = useCallback(() => {
    getKickKey()?.commitSpace();
    playKeySound();
    setComposing('');
    if (language === 'en' && isShift && !isCapsLock) setIsShift(false);
  }, [language, isShift, isCapsLock]);

  const handleEnter = useCallback(() => {
    getKickKey()?.sendEnter();
    playKeySound();
    setComposing('');
  }, []);

  const handleShift = useCallback(() => {
    if (!isShift && !isCapsLock)      { setIsShift(true); }
    else if (isShift && !isCapsLock)  { setIsCapsLock(true); }
    else                              { setIsShift(false); setIsCapsLock(false); }
  }, [isShift, isCapsLock]);

  const handleLanguageSwitch = useCallback(() => {
    getKickKey()?.flushBanglaBuffer().catch(() => {});
    setComposing('');
    setLanguage(l => l === 'en' ? 'bn' : 'en');
    setSuggestions([]);
    setCurrentWord('');
    setIsShift(false);
    setIsCapsLock(false);
  }, []);

  const handleSymbolToggle = useCallback(() => {
    if (language === 'bn') getKickKey()?.flushBanglaBuffer().catch(() => {});
    setIsSymbol(s => !s);
    setIsShift(false);
    setIsCapsLock(false);
    setComposing('');
  }, [language]);

  const handleEmojiToggle = useCallback(() => {
    if (language === 'bn') getKickKey()?.flushBanglaBuffer().catch(() => {});
    setIsEmoji(e => !e);
    setIsClipboard(false);
    setComposing('');
  }, [language]);

  const handleClipboardToggle = useCallback(() => {
    if (language === 'bn') getKickKey()?.flushBanglaBuffer().catch(() => {});
    setIsClipboard(c => !c);
    setIsEmoji(false);
    setComposing('');
  }, [language]);

  // ── Phase 4: commitSuggestion via native module ──────────────────────────

  const handleSuggestionSelect = useCallback((word: string) => {
    getKickKey()?.commitSuggestion(word);
    setSuggestions([]);
    setCurrentWord('');
    setComposing('');
  }, []);

  return {
    language, isShift, isCapsLock, isSymbol, isEmoji, isClipboard,
    suggestions, composingText,
    currentWord,
    isPassword, isNumber, isPhone, isUrl, isEmail, imeAction,
    handleKeyPress, handleBackspace, handleBackspaceLongPress,
    handleBackspaceLongPressEnd,
    handleSpace, handleEnter, handleShift, handleLanguageSwitch,
    handleSymbolToggle, handleEmojiToggle, handleClipboardToggle,
    handleSuggestionSelect,
  };
}
