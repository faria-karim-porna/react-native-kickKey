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

    isOverlayGranted: (): Promise<boolean> =>
      isAvailable ? KickKey.isOverlayGranted() : Promise.resolve(false),
    openOverlaySettings: (): void => {
      if (isAvailable) KickKey.openOverlaySettings();
    },
  };
}
