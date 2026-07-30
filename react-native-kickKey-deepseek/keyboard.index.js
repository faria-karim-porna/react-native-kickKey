// keyboard.index.js — Keyboard Bundle Entry Point
//
// This is the entry point for the keyboard-only bundle loaded inside
// KickKeyInputMethodService. It must import NOTHING from the companion app.
//
// ⚠️  This file MUST remain .js — React Native's bundler resolves
//     keyboard.index.js as the entry file for the keyboard bundle.

import { AppRegistry, LogBox } from 'react-native';
import KeyboardScreen from './src/keyboard/KeyboardScreen';

// Suppress non-critical warnings in the keyboard bundle
LogBox.ignoreLogs([
  'NativeEventEmitter',
  'new NativeEventEmitter()',
]);

// Global error handler — logs to logcat so bundle-level crashes are diagnosable
const defaultHandler =
  global.ErrorUtils?.getGlobalHandler?.() ?? (() => {});

global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  console.error(`[KickKey JS ${isFatal ? 'FATAL' : 'ERROR'}]`, error?.message, error?.stack);
  defaultHandler(error, isFatal);
});

// Catch unhandled promise rejections
if (global.HermesInternal == null) {
  // Non-Hermes fallback (shouldn't happen, but just in case)
} else if (typeof global.Promise !== 'undefined') {
  const origReject = global.Promise.reject;
  if (!global.__kickkeyPromisePatched) {
    global.__kickkeyPromisePatched = true;
    global.Promise.reject = function (reason) {
      console.error('[KickKey] Unhandled promise rejection:', reason);
      return origReject.call(this, reason);
    };
  }
}

/**
 * Register the keyboard UI component.
 * The name 'KickKeyKeyboard' MUST match the second argument of
 * host.createSurface() in KickKeyInputMethodService.kt
 */
AppRegistry.registerComponent('KickKeyKeyboard', () => KeyboardScreen);
