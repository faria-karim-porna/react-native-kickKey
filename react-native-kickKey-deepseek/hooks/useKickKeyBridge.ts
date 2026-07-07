import { NativeModules } from 'react-native';

const { KickKey } = NativeModules;

export function useKickKeyBridge() {
  return {
    isDefaultKeyboard: (): Promise<boolean> => KickKey.isDefaultKeyboard(),
    isKeyboardEnabled: (): Promise<boolean> => KickKey.isKeyboardEnabled(),
    openKeyboardSettings: (): void => KickKey.openKeyboardSettings(),

    savePreferences: (prefs: Record<string, any>): Promise<void> =>
      KickKey.savePreferences(prefs),
    getPreferences: (): Promise<Record<string, any>> =>
      KickKey.getPreferences(),

    setDictionaryWords: (words: string[]): Promise<void> =>
      KickKey.setDictionaryWords(words),
    getDictionaryWords: (): Promise<string[]> =>
      KickKey.getDictionaryWords(),
    removeDictionaryWord: (word: string): Promise<void> =>
      KickKey.removeDictionaryWord(word),
  };
}
