import type { ThemeColors, ThemeName } from '../store/settingsStore';

export interface ThemePreset {
  name: ThemeName;
  label: string;
  colors: ThemeColors;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'light',
    label: 'Qykey Light',
    colors: {
      keyboardBg:     '#e0e5ec',
      keyBg:          '#f2f2f2',
      keyText:        '#444444',
      specialKeyBg:   '#c8ccd0',
      specialKeyText: '#444444',
      themePrimary:   '#8594aa',
    },
  },
  {
    name: 'nord',
    label: 'Nordic Frost',
    colors: {
      keyboardBg:     '#2e3440',
      keyBg:          '#3b4252',
      keyText:        '#eceff4',
      specialKeyBg:   '#434c5e',
      specialKeyText: '#88c0d0',
      themePrimary:   '#81a1c1',
    },
  },
];
