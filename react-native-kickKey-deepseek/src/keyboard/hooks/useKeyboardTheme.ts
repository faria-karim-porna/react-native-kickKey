import { useState, useEffect } from 'react';
import { NativeModules } from 'react-native';
import type { Theme } from '../types';
import { DEFAULT_DARK_THEME } from '../constants/defaultTheme';

const { KickKey } = NativeModules;

export function useKeyboardTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(DEFAULT_DARK_THEME);

  useEffect(() => {
    // Load preferences once on mount
    KickKey.getPreferences()
      .then((prefs: Record<string, any>) => {
        setTheme({
          keyboardBg:       prefs.keyboardBg      ?? DEFAULT_DARK_THEME.keyboardBg,
          keyBg:            prefs.themeKeyBg      ?? DEFAULT_DARK_THEME.keyBg,
          keyText:          prefs.themeKeyText    ?? DEFAULT_DARK_THEME.keyText,
          specialKeyBg:     prefs.specialKeyBg    ?? DEFAULT_DARK_THEME.specialKeyBg,
          specialKeyText:   prefs.themeKeyText    ?? DEFAULT_DARK_THEME.specialKeyText,
          altText:          DEFAULT_DARK_THEME.altText,
          suggestionBg:     DEFAULT_DARK_THEME.suggestionBg,
          suggestionText:   prefs.themePrimary    ?? DEFAULT_DARK_THEME.suggestionText,
          suggestionDivider:DEFAULT_DARK_THEME.suggestionDivider,
          keyShadow:        DEFAULT_DARK_THEME.keyShadow,
          popupBg:          prefs.specialKeyBg    ?? DEFAULT_DARK_THEME.popupBg,
          popupText:        prefs.themeKeyText    ?? DEFAULT_DARK_THEME.popupText,
          keyHeight:        Number(prefs.keyHeight)       || DEFAULT_DARK_THEME.keyHeight,
          keyBorderRadius:  Number(prefs.keyBorderRadius) || DEFAULT_DARK_THEME.keyBorderRadius,
          keyFontSize:      Number(prefs.fontSize)        || DEFAULT_DARK_THEME.keyFontSize,
          keyMargin:        Number(prefs.keyMargin)       || DEFAULT_DARK_THEME.keyMargin,
        });
      })
      .catch(() => {
        // SharedPreferences not accessible (first launch or :ime_process cold start)
        // Silently use DEFAULT_DARK_THEME already set in initial state
      });
  }, []);

  return theme;
}
