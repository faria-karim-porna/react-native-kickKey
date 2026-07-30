import { useState, useEffect, useRef } from 'react';
import { NativeModules } from 'react-native';
import type { Theme } from '../types';
import { DEFAULT_DARK_THEME } from '../constants/defaultTheme';

/**
 * Attempt to load theme preferences from the native module.
 * Returns true if successful, false if the module isn't available yet.
 */
function loadPreferences(setTheme: (t: Theme) => void): boolean {
  const KickKey = NativeModules.KickKey;
  if (!KickKey) return false;

  KickKey.getPreferences()
    .then((prefs: Record<string, any>) => {
      setTheme({
        keyboardBg:       prefs.keyboardBg       ?? DEFAULT_DARK_THEME.keyboardBg,
        keyBg:            prefs.themeKeyBg       ?? DEFAULT_DARK_THEME.keyBg,
        keyText:          prefs.themeKeyText     ?? DEFAULT_DARK_THEME.keyText,
        specialKeyBg:     prefs.specialKeyBg     ?? DEFAULT_DARK_THEME.specialKeyBg,
        specialKeyText:   prefs.themeKeyText     ?? DEFAULT_DARK_THEME.specialKeyText,
        altText:          DEFAULT_DARK_THEME.altText,
        suggestionBg:     DEFAULT_DARK_THEME.suggestionBg,
        suggestionText:   prefs.themePrimary     ?? DEFAULT_DARK_THEME.suggestionText,
        suggestionDivider:DEFAULT_DARK_THEME.suggestionDivider,
        keyShadow:        DEFAULT_DARK_THEME.keyShadow,
        popupBg:          prefs.specialKeyBg     ?? DEFAULT_DARK_THEME.popupBg,
        popupText:        prefs.themeKeyText     ?? DEFAULT_DARK_THEME.popupText,
        keyHeight:        Number(prefs.keyHeight)       || DEFAULT_DARK_THEME.keyHeight,
        keyBorderRadius:  Number(prefs.keyBorderRadius) || DEFAULT_DARK_THEME.keyBorderRadius,
        keyFontSize:      Number(prefs.fontSize)        || DEFAULT_DARK_THEME.keyFontSize,
        keyMargin:        Number(prefs.keyMargin)       || DEFAULT_DARK_THEME.keyMargin,
      });
    })
    .catch(() => {
      // SharedPreferences not accessible — use DEFAULT_DARK_THEME
    });

  return true;
}

export function useKeyboardTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(DEFAULT_DARK_THEME);
  const loaded = useRef(false);

  useEffect(() => {
    // Reset on each mount (keyboard open/close cycle)
    loaded.current = false;

    // Try loading immediately
    if (loadPreferences(setTheme)) {
      loaded.current = true;
      return;
    }

    // Module not available yet — retry with increasing delay (200ms, 400ms, ...)
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 5; i++) {
      timers.push(
        setTimeout(() => {
          if (!loaded.current) {
            if (loadPreferences(setTheme)) {
              loaded.current = true;
            }
          }
        }, 200 * i)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return theme;
}
