// ============================================================
// useKeyboardTheme.ts — reads theme colors from SharedPreferences
// in the IME process (separate from the main app's Zustand store).
//
// The keyboard's static styles.ts imports are replaced with
// dynamic styles created by createStyles(colors) so the keyboard
// adapts to light/dark themes instantly.
// ============================================================

import { useState, useEffect } from 'react';
import { NativeModules } from 'react-native';

export interface KeyboardThemeColors {
  keyboardBg: string;
  keyBg: string;
  keyText: string;
  specialKeyBg: string;
  specialKeyText: string;
  themePrimary: string;
}

const LIGHT_COLORS: KeyboardThemeColors = {
  keyboardBg:   '#e0e5ec',
  keyBg:        '#f2f2f2',
  keyText:      '#444444',
  specialKeyBg: '#c8ccd0',
  specialKeyText: '#444444',
  themePrimary: '#8594aa',
};

const DARK_COLORS: KeyboardThemeColors = {
  keyboardBg:   '#2e3440',
  keyBg:        '#3b4252',
  keyText:      '#eceff4',
  specialKeyBg: '#434c5e',
  specialKeyText: '#88c0d0',
  themePrimary: '#81a1c1',
};

let _KickKey: any = null;
function getKickKey() {
  if (!_KickKey) _KickKey = NativeModules.KickKey;
  return _KickKey;
}

/**
 * Returns the current keyboard theme colors. Reads from SharedPreferences
 * on mount and when the app returns to foreground (via AppState listener
 * in the parent, which re-mounts the keyboard).
 */
export function useKeyboardTheme(): KeyboardThemeColors {
  const [colors, setColors] = useState<KeyboardThemeColors>(LIGHT_COLORS);

  useEffect(() => {
    getKickKey()
      ?.getPreferences()
      ?.then((prefs: any) => {
        if (!prefs) return;
        const theme = prefs.theme || 'light';
        const isDark = theme === 'nord';
        if (isDark) {
          setColors({
            keyboardBg:    prefs.keyboardBg   || DARK_COLORS.keyboardBg,
            keyBg:         prefs.themeKeyBg   || DARK_COLORS.keyBg,
            keyText:       prefs.themeKeyText  || DARK_COLORS.keyText,
            specialKeyBg:  prefs.specialKeyBg  || DARK_COLORS.specialKeyBg,
            specialKeyText: DARK_COLORS.specialKeyText,
            themePrimary:  prefs.themePrimary  || DARK_COLORS.themePrimary,
          });
        } else {
          setColors({
            keyboardBg:    prefs.keyboardBg   || LIGHT_COLORS.keyboardBg,
            keyBg:         prefs.themeKeyBg   || LIGHT_COLORS.keyBg,
            keyText:       prefs.themeKeyText  || LIGHT_COLORS.keyText,
            specialKeyBg:  prefs.specialKeyBg  || LIGHT_COLORS.specialKeyBg,
            specialKeyText: LIGHT_COLORS.specialKeyText,
            themePrimary:  prefs.themePrimary  || LIGHT_COLORS.themePrimary,
          });
        }
      })
      .catch(() => {});
  }, []);

  return colors;
}
