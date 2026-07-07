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
      themePrimary:   '#00BCD4',
    },
  },
  {
    name: 'light',
    label: 'Light',
    colors: {
      keyboardBg:     '#e8e8ed',
      keyBg:          '#ffffff',
      keyText:        '#1a1a1a',
      specialKeyBg:   '#d0d0d8',
      specialKeyText: '#1a1a1a',
      themePrimary:   '#0077B6',
    },
  },
  {
    name: 'amoled',
    label: 'AMOLED Black',
    colors: {
      keyboardBg:     '#000000',
      keyBg:          '#0a0a0a',
      keyText:        '#ffffff',
      specialKeyBg:   '#161616',
      specialKeyText: '#ffffff',
      themePrimary:   '#00E5FF',
    },
  },
];
