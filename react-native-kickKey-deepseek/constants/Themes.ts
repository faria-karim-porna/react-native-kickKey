import type { ThemeColors, ThemeName } from '../store/settingsStore';

export interface ThemePreset {
  name: ThemeName;
  label: string;
  colors: ThemeColors;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'dark',
    label: 'Dark',
    colors: {
      keyboardBg:     '#0d0d1a',
      keyBg:          '#1e1e2e',
      keyText:        '#ffffff',
      specialKeyBg:   '#2a2a40',
      specialKeyText: '#ffffff',
      themePrimary:   '#8594aa',
    },
  },
  {
    name: 'light',
    label: 'Light',
    // Colors taken straight from the qykey keyboard look:
    // base #e0e5ec, keys #f2f2f2 with #444 labels, special keys #c8ccd0,
    // and #8594aa as the wire/slider accent.
    colors: {
      keyboardBg:     '#e0e5ec',
      keyBg:          '#f2f2f2',
      keyText:        '#444444',
      specialKeyBg:   '#c8ccd0',
      specialKeyText: '#444444',
      themePrimary:   '#8594aa',
    },
  },
];
