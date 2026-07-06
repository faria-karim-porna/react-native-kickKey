// keyboard.index.js — Keyboard Bundle Entry Point
//
// This is the entry point for the keyboard-only bundle loaded inside
// KickKeyInputMethodService. It must import NOTHING from the companion app.
//
// ⚠️  This file MUST remain .js — React Native's bundler resolves
//     keyboard.index.js as the entry file for the keyboard bundle.

import { AppRegistry } from 'react-native';
import KeyboardScreen from './src/keyboard/KeyboardScreen';

/**
 * Register the keyboard UI component.
 * The name 'KickKeyKeyboard' MUST match the second argument of
 * reactRootView.startReactApplication() in KickKeyInputMethodService.kt
 */
AppRegistry.registerComponent('KickKeyKeyboard', () => KeyboardScreen);
