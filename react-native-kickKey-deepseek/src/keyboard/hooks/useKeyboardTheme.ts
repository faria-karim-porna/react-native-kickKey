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
import { NativeModules, NativeEventEmitter } from 'react-native';
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

export function useKeyboardTheme(): KeyboardThemeColors {
  const storeThemeColors = useSettingsStore((s) => s.themeColors);
  const storeKeyHeight = useSettingsStore((s) => s.keyHeight);
  const storeKeyBorderRadius = useSettingsStore((s) => s.keyBorderRadius);
  const storeFontSize = useSettingsStore((s) => s.fontSize);

  const [colors, setColors] = useState<KeyboardThemeColors>(() => ({
    keyboardBg: storeThemeColors?.keyboardBg || LIGHT_COLORS.keyboardBg,
    keyBg: storeThemeColors?.keyBg || LIGHT_COLORS.keyBg,
    keyText: storeThemeColors?.keyText || LIGHT_COLORS.keyText,
    specialKeyBg: storeThemeColors?.specialKeyBg || LIGHT_COLORS.specialKeyBg,
    specialKeyText: storeThemeColors?.specialKeyText || LIGHT_COLORS.specialKeyText,
    themePrimary: storeThemeColors?.themePrimary || LIGHT_COLORS.themePrimary,
    keyHeight: storeKeyHeight || LIGHT_COLORS.keyHeight,
    keyBorderRadius: storeKeyBorderRadius || LIGHT_COLORS.keyBorderRadius,
    fontSize: storeFontSize || LIGHT_COLORS.fontSize,
  }));

  // Sync state whenever Zustand settings store updates (in-app)
  useEffect(() => {
    if (storeThemeColors && storeThemeColors.keyboardBg) {
      setColors({
        keyboardBg: storeThemeColors.keyboardBg,
        keyBg: storeThemeColors.keyBg,
        keyText: storeThemeColors.keyText,
        specialKeyBg: storeThemeColors.specialKeyBg,
        specialKeyText: storeThemeColors.specialKeyText,
        themePrimary: storeThemeColors.themePrimary,
        keyHeight: storeKeyHeight || LIGHT_COLORS.keyHeight,
        keyBorderRadius: storeKeyBorderRadius || LIGHT_COLORS.keyBorderRadius,
        fontSize: storeFontSize || LIGHT_COLORS.fontSize,
      });
    }
  }, [storeThemeColors, storeKeyHeight, storeKeyBorderRadius, storeFontSize]);

  // Hydrate from native SharedPreferences and listen for live events (e.g. IME process)
  useEffect(() => {
    const fetchNativePrefs = () => {
      getKickKey()
        ?.getPreferences()
        ?.then((prefs: any) => {
          if (!prefs || Object.keys(prefs).length === 0) return;
          const theme = prefs.theme || 'light';
          const isDark = theme === 'nord' || prefs.keyboardBg === '#2e3440';
          const defaultColors = isDark ? DARK_COLORS : LIGHT_COLORS;

          const keyHeight = typeof prefs.keyHeight === 'number' ? prefs.keyHeight : defaultColors.keyHeight;
          const keyBorderRadius = typeof prefs.keyBorderRadius === 'number' ? prefs.keyBorderRadius : defaultColors.keyBorderRadius;
          const fontSize = typeof prefs.fontSize === 'number' ? prefs.fontSize : defaultColors.fontSize;

          setColors((prev) => ({
            keyboardBg:    prefs.keyboardBg   || prev.keyboardBg,
            keyBg:         prefs.themeKeyBg   || prev.keyBg,
            keyText:       prefs.themeKeyText  || prev.keyText,
            specialKeyBg:  prefs.specialKeyBg  || prev.specialKeyBg,
            specialKeyText: defaultColors.specialKeyText,
            themePrimary:  prefs.themePrimary  || prev.themePrimary,
            keyHeight:     keyHeight           || prev.keyHeight,
            keyBorderRadius: keyBorderRadius   || prev.keyBorderRadius,
            fontSize:      fontSize            || prev.fontSize,
          }));
        })
        .catch(() => {});
    };

    fetchNativePrefs();

    if (NativeModules.KickKey) {
      const emitter = new NativeEventEmitter(NativeModules.KickKey);
      const sub = emitter.addListener('kickkey_preferencesChanged', (prefMap: any) => {
        if (prefMap) {
          const isDark = prefMap.theme === 'nord' || prefMap.keyboardBg === '#2e3440';
          const defaultColors = isDark ? DARK_COLORS : LIGHT_COLORS;

          setColors((prev) => ({
            keyboardBg:    prefMap.keyboardBg   || defaultColors.keyboardBg,
            keyBg:         prefMap.themeKeyBg   || defaultColors.keyBg,
            keyText:       prefMap.themeKeyText  || defaultColors.keyText,
            specialKeyBg:  prefMap.specialKeyBg  || defaultColors.specialKeyBg,
            specialKeyText: defaultColors.specialKeyText,
            themePrimary:  prefMap.themePrimary  || defaultColors.themePrimary,
            keyHeight:     prefMap.keyHeight     || prev.keyHeight,
            keyBorderRadius: prefMap.keyBorderRadius || prev.keyBorderRadius,
            fontSize:      prefMap.fontSize      || prev.fontSize,
          }));
        } else {
          fetchNativePrefs();
        }
      });
      return () => sub.remove();
    }
  }, []);

  return colors;
}
