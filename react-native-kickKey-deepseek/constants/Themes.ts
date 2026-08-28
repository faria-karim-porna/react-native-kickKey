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
  {
    name: 'dark',
    label: 'Dark Obsidian',
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
  {
    name: 'midnight',
    label: 'Midnight OLED',
    colors: {
      keyboardBg:     '#000000',
      keyBg:          '#121212',
      keyText:        '#f5f5f5',
      specialKeyBg:   '#1f1f1f',
      specialKeyText: '#a0a0a0',
      themePrimary:   '#5e7a9c',
    },
  },
  {
    name: 'cyberpunk',
    label: 'Cyberpunk Neon',
    colors: {
      keyboardBg:     '#0f051d',
      keyBg:          '#200b3b',
      keyText:        '#00ffcc',
      specialKeyBg:   '#341261',
      specialKeyText: '#ff007f',
      themePrimary:   '#00ffcc',
    },
  },
  {
    name: 'sunset',
    label: 'Warm Sunset',
    colors: {
      keyboardBg:     '#2b1820',
      keyBg:          '#3d222e',
      keyText:        '#ffe4d6',
      specialKeyBg:   '#542f40',
      specialKeyText: '#ff8a5b',
      themePrimary:   '#ff6b6b',
    },
  },
];
