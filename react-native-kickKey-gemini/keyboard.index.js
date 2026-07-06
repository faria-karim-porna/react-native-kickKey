// keyboard.index.js (project root)
import { AppRegistry } from 'react-native';
import KeyboardScreen from './src/keyboard/KeyboardScreen';

/**
 * Register the keyboard UI component.
 * The name 'KickKeyKeyboard' MUST match the second argument of
 * reactInstanceManager.startReactApplication() in KickKeyInputMethodService.kt
 */
AppRegistry.registerComponent('KickKeyKeyboard', () => KeyboardScreen);
