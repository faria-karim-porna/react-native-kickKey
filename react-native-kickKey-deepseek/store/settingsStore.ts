import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'dark' | 'light' | 'nord' | 'cyberpunk' | 'midnight' | 'sunset' | 'custom' | string;
export type CursorType = 'classic' | 'bubble' | 'sharp' | 'motion' | 'solid' | 'dot' | 'crosshair' | 'target' | 'dashed' | 'loading' | 'sparkle' | 'pointer' | 'hand' | 'click' | 'fast' | 'energy' | 'refresh' | 'filled' | 'play' | 'bold' | 'underline' | 'outline' | 'thick' | 'thin' | 'small';

export interface ThemeColors {
  keyboardBg: string;
  keyBg: string;
  keyText: string;
  specialKeyBg: string;
  specialKeyText: string;
  themePrimary: string;
}

interface SettingsState {
  // Onboarding
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (done: boolean) => void;

  // Language
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;

  // Theme
  theme: ThemeName;
  themeColors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  setThemeColors: (colors: Partial<ThemeColors>) => void;

  // Layout
  keyHeight: number;
  keyBorderRadius: number;
  fontSize: number;
  keyMargin: number;
  setKeyHeight: (v: number) => void;
  setKeyBorderRadius: (v: number) => void;
  setFontSize: (v: number) => void;

  // Cursor
  cursorType: CursorType;
  cursorColor: string;
  cursorSize: number;
  setCursorType: (type: CursorType) => void;
  setCursorColor: (color: string) => void;
  setCursorSize: (size: number) => void;

  // Feedback
  hapticEnabled: boolean;
  soundEnabled: boolean;
  toggleHaptic: () => void;
  toggleSound: () => void;

  // Input behavior
  autoCorrect: boolean;
  showSuggestions: boolean;
  toggleAutoCorrect: () => void;
  toggleShowSuggestions: () => void;

  // Custom dictionary (per-language)
  customWordsEn: string[];
  customWordsBn: string[];
  addCustomWord: (word: string, lang: 'en' | 'bn') => void;
  removeCustomWord: (word: string, lang: 'en' | 'bn') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: (done) => set({ hasCompletedOnboarding: done }),

      language: 'en',
      setLanguage: (language) => set({ language }),

      theme: 'light',
      themeColors: {
        keyboardBg:     '#e0e5ec',
        keyBg:          '#f2f2f2',
        keyText:        '#444444',
        specialKeyBg:   '#c8ccd0',
        specialKeyText: '#444444',
        themePrimary:   '#8594aa',
      },
      setTheme: (theme) => set({ theme }),
      setThemeColors: (colors) =>
        set((s) => ({ themeColors: { ...s.themeColors, ...colors } })),

      keyHeight: 48,
      keyBorderRadius: 6,
      fontSize: 16,
      keyMargin: 3,
      setKeyHeight: (keyHeight) => set({ keyHeight }),
      setKeyBorderRadius: (keyBorderRadius) => set({ keyBorderRadius }),
      setFontSize: (fontSize) => set({ fontSize }),

      cursorType: 'classic',
      cursorColor: '#8594aa',
      cursorSize: 24,
      setCursorType: (cursorType) => set({ cursorType }),
      setCursorColor: (cursorColor) => set({ cursorColor }),
      setCursorSize: (cursorSize) => set({ cursorSize }),

      hapticEnabled: true,
      soundEnabled: false,
      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      autoCorrect: true,
      showSuggestions: true,
      toggleAutoCorrect: () => set((s) => ({ autoCorrect: !s.autoCorrect })),
      toggleShowSuggestions: () => set((s) => ({ showSuggestions: !s.showSuggestions })),

      customWordsEn: [],
      customWordsBn: [],
      addCustomWord: (word, lang) =>
        set((s) => {
          const key = lang === 'bn' ? 'customWordsBn' : 'customWordsEn';
          return { [key]: [...new Set([...s[key], word.trim().toLowerCase()])] };
        }),
      removeCustomWord: (word, lang) =>
        set((s) => {
          const key = lang === 'bn' ? 'customWordsBn' : 'customWordsEn';
          return { [key]: s[key].filter((w) => w !== word) };
        }),
    }),
    {
      name: 'kickkey-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Record<string, any> | undefined;
        if (!state) return persisted;
        // v0 → v1: 'amoled' preset removed
        if (state.theme === 'amoled') {
          state.theme = 'dark' as ThemeName;
        }
        // v1 → v2: split flat customWords into per-language arrays
        if (Array.isArray(state.customWords)) {
          const en: string[] = [];
          const bn: string[] = [];
          for (const w of state.customWords) {
            if (typeof w === 'string' && /\p{Script=Bengali}/u.test(w)) {
              bn.push(w);
            } else {
              en.push(w);
            }
          }
          state.customWordsEn = en;
          state.customWordsBn = bn;
          delete state.customWords;
        }
        return state;
      },
    }
  )
);
