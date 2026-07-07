import { NativeModules } from 'react-native';

const { KickKey } = NativeModules;

/**
 * Plays the optional key-click sound.
 * Silently does nothing if sound is disabled (the Kotlin side checks the preference).
 * Called from useKeyboardState.handleKeyPress() alongside hapticManager.vibrate().
 */
export function playKeySound(): void {
  try {
    KickKey.playKeySound();
  } catch {
    // Ignore — sound is optional and should never crash the keyboard
  }
}
