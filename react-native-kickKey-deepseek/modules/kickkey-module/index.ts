import { NativeModules } from 'react-native';

const { KickKey } = NativeModules;

export default {
  /**
   * Returns true if KickKey is currently set as the default keyboard.
   */
  isDefaultKeyboard: (): Promise<boolean> =>
    KickKey.isDefaultKeyboard(),

  /**
   * Returns true if KickKey is in the enabled keyboards list.
   */
  isKeyboardEnabled: (): Promise<boolean> =>
    KickKey.isKeyboardEnabled(),

  /**
   * Opens Android Settings → Keyboard to let user enable/switch keyboards.
   */
  openKeyboardSettings: (): void =>
    KickKey.openKeyboardSettings(),
};
