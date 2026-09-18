import { NativeModules } from 'react-native';

const { KickKey } = NativeModules;
const isAvailable = !!KickKey;

export function useKickKeyBridge() {
  return {
    isDefaultKeyboard: (): Promise<boolean> =>
      isAvailable ? KickKey.isDefaultKeyboard() : Promise.resolve(false),
    isKeyboardEnabled: (): Promise<boolean> =>
      isAvailable ? KickKey.isKeyboardEnabled() : Promise.resolve(false),
    openKeyboardSettings: (): void => {
      if (isAvailable) KickKey.openKeyboardSettings();
    },
    showInputMethodPicker: (): void => {
      if (isAvailable) KickKey.showInputMethodPicker();
    },

    savePreferences: (prefs: Record<string, any>): Promise<void> =>
      isAvailable ? KickKey.savePreferences(prefs) : Promise.resolve(),
    getPreferences: (): Promise<Record<string, any>> =>
      isAvailable ? KickKey.getPreferences() : Promise.resolve({}),

    setDictionaryWords: (words: string[]): Promise<void> =>
      isAvailable ? KickKey.setDictionaryWords(words) : Promise.resolve(),
    getDictionaryWords: (): Promise<string[]> =>
      isAvailable ? KickKey.getDictionaryWords() : Promise.resolve([]),
    removeDictionaryWord: (word: string): Promise<void> =>
      isAvailable ? KickKey.removeDictionaryWord(word) : Promise.resolve(),

    setCustomDictionary: (enWords: string[] = [], bnWords: string[] = []): Promise<void> => {
      // A native build older than this JS bundle has no setCustomDictionary, and
      // calling through would throw "undefined is not a function" from the effect
      // that calls this, so check the method itself instead of the module.
      if (typeof KickKey?.setCustomDictionary !== 'function') return Promise.resolve();
      return KickKey.setCustomDictionary(
        Array.isArray(enWords) ? enWords : [],
        Array.isArray(bnWords) ? bnWords : []
      );
    },
    getCustomDictionary: (lang: string): Promise<string[]> =>
      typeof KickKey?.getCustomDictionary === 'function'
        ? KickKey.getCustomDictionary(lang)
        : Promise.resolve([]),

    isOverlayGranted: (): Promise<boolean> =>
      isAvailable ? KickKey.isOverlayGranted() : Promise.resolve(false),
    openOverlaySettings: (): void => {
      if (isAvailable) KickKey.openOverlaySettings();
    },
  };
}
