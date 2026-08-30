// ============================================================
// useKeyboardTheme.ts — reads theme colors + layout prefs from
// SharedPreferences in the IME process (separate from the
// main app's Zustand store).
//
// The keyboard's dynamic styles are created by createStyles(colors)
// so the keyboard adapts to light/dark themes instantly.
// keyHeight, keyBorderRadius, fontSize come from the Settings screen
// sliders and are pushed via useSettingsSync.
// ============================================================

import { useState, useEffect } from 'react';
import { NativeModules } from 'react-native';
import { useSettingsStore } from '../../../store/settingsStore';

export interface KeyboardThemeColors {
  keyboardBg: string;
  keyBg: string;
  keyText: string;
  specialKeyBg: string;
  specialKeyText: string;
  themePrimary: string;
  // Layout (from Settings sliders)
  keyHeight: number;
  keyBorderRadius: number;
  fontSize: number;
}

const LIGHT_COLORS: KeyboardThemeColors = {
  keyboardBg:   '#e0e5ec',
  keyBg:        '#f2f2f2',
  keyText:      '#444444',
  specialKeyBg: '#c8ccd0',
  specialKeyText: '#444444',
  themePrimary: '#8594aa',
  keyHeight: 48,
  keyBorderRadius: 6,
  fontSize: 16,
};

const DARK_COLORS: KeyboardThemeColors = {
  keyboardBg:   '#2e3440',
  keyBg:        '#3b4252',
  keyText:      '#eceff4',
  specialKeyBg: '#434c5e',
  specialKeyText: '#88c0d0',
  themePrimary: '#81a1c1',
  keyHeight: 48,
  keyBorderRadius: 6,
  fontSize: 16,
};

let _KickKey: any = null;
function getKickKey() {
  if (!_KickKey) _KickKey = NativeModules.KickKey;
  return _KickKey;
}

/**
 * Returns the current keyboard theme colors + layout values.
 * Reads from SharedPreferences on mount and when the app returns
 * to foreground (via AppState listener in the parent, which
 * re-mounts the keyboard).
 */
export function useKeyboardTheme(): KeyboardThemeColors {
  const storeThemeColors = useSettingsStore((s) => s.themeColors);
  const storeKeyHeight = useSettingsStore((s) => s.keyHeight);
  const storeKeyBorderRadius = useSettingsStore((s) => s.keyBorderRadius);
  const storeFontSize = useSettingsStore((s) => s.fontSize);

  const [colors, setColors] = useState<KeyboardThemeColors>(() => ({
    keyboardBg: storeThemeColors.keyboardBg || LIGHT_COLORS.keyboardBg,
    keyBg: storeThemeColors.keyBg || LIGHT_COLORS.keyBg,
    keyText: storeThemeColors.keyText || LIGHT_COLORS.keyText,
    specialKeyBg: storeThemeColors.specialKeyBg || LIGHT_COLORS.specialKeyBg,
    specialKeyText: storeThemeColors.specialKeyText || LIGHT_COLORS.specialKeyText,
    themePrimary: storeThemeColors.themePrimary || LIGHT_COLORS.themePrimary,
    keyHeight: storeKeyHeight || LIGHT_COLORS.keyHeight,
    keyBorderRadius: storeKeyBorderRadius || LIGHT_COLORS.keyBorderRadius,
    fontSize: storeFontSize || LIGHT_COLORS.fontSize,
  }));

  // Sync state whenever Zustand settings store updates
  useEffect(() => {
    setColors({
      keyboardBg: storeThemeColors.keyboardBg || LIGHT_COLORS.keyboardBg,
      keyBg: storeThemeColors.keyBg || LIGHT_COLORS.keyBg,
      keyText: storeThemeColors.keyText || LIGHT_COLORS.keyText,
      specialKeyBg: storeThemeColors.specialKeyBg || LIGHT_COLORS.specialKeyBg,
      specialKeyText: storeThemeColors.specialKeyText || LIGHT_COLORS.specialKeyText,
      themePrimary: storeThemeColors.themePrimary || LIGHT_COLORS.themePrimary,
      keyHeight: storeKeyHeight || LIGHT_COLORS.keyHeight,
      keyBorderRadius: storeKeyBorderRadius || LIGHT_COLORS.keyBorderRadius,
      fontSize: storeFontSize || LIGHT_COLORS.fontSize,
    });
  }, [storeThemeColors, storeKeyHeight, storeKeyBorderRadius, storeFontSize]);

  // Also hydrate from native SharedPreferences on mount if available (e.g. IME process)
  useEffect(() => {
    getKickKey()
      ?.getPreferences()
      ?.then((prefs: any) => {
        if (!prefs) return;
        const theme = prefs.theme || 'light';
        const isDark = theme === 'nord';

        const keyHeight = typeof prefs.keyHeight === 'number' ? prefs.keyHeight : (isDark ? DARK_COLORS.keyHeight : LIGHT_COLORS.keyHeight);
        const keyBorderRadius = typeof prefs.keyBorderRadius === 'number' ? prefs.keyBorderRadius : (isDark ? DARK_COLORS.keyBorderRadius : LIGHT_COLORS.keyBorderRadius);
        const fontSize = typeof prefs.fontSize === 'number' ? prefs.fontSize : (isDark ? DARK_COLORS.fontSize : LIGHT_COLORS.fontSize);

        const defaultColors = isDark ? DARK_COLORS : LIGHT_COLORS;

        setColors({
          keyboardBg:    prefs.keyboardBg   || defaultColors.keyboardBg,
          keyBg:         prefs.themeKeyBg   || defaultColors.keyBg,
          keyText:       prefs.themeKeyText  || defaultColors.keyText,
          specialKeyBg:  prefs.specialKeyBg  || defaultColors.specialKeyBg,
          specialKeyText: defaultColors.specialKeyText,
          themePrimary:  prefs.themePrimary  || defaultColors.themePrimary,
          keyHeight,
          keyBorderRadius,
          fontSize,
        });
      })
      .catch(() => {});
  }, []);

  return colors;
}
