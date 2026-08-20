import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'dark' | 'light' | 'amoled' | 'custom';
export type CursorType = 'line' | 'block' | 'underline' | 'arrow' | 'pointer' | 'crosshair' | 'grab';

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

  // Custom dictionary
  customWords: string[];
  addCustomWord: (word: string) => void;
  removeCustomWord: (word: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: (done) => set({ hasCompletedOnboarding: done }),

      language: 'en',
      setLanguage: (language) => set({ language }),

      theme: 'dark',
      themeColors: {
        keyboardBg:     '#0d0d1a',
        keyBg:          '#1e1e2e',
        keyText:        '#ffffff',
        specialKeyBg:   '#2a2a40',
        specialKeyText: '#ffffff',
        themePrimary:   '#00BCD4',
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

      cursorType: 'line',
      cursorColor: '#00BCD4',
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

      customWords: [],
      addCustomWord: (word) =>
        set((s) => ({
          customWords: [...new Set([...s.customWords, word.trim().toLowerCase()])],
        })),
      removeCustomWord: (word) =>
        set((s) => ({
          customWords: s.customWords.filter((w) => w !== word),
        })),
    }),
    {
      name: 'kickkey-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
