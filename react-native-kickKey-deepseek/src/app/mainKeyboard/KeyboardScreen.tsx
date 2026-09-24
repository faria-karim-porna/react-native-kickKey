// ============================================================
// KeyboardScreen.tsx — root of the KickKey keyboard bundle.
//
// Renders the qykey-style "chocolate bar" keyboard (fixed light
// look, compact keys) wired to the native KickKey IME module.
// ============================================================

import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import KickKeyKeyboard from './keyboard/KickKeyKeyboard';

export default function KeyboardScreen() {
  return (
    <ErrorBoundary>
      <KickKeyKeyboard />
    </ErrorBoundary>
  );
}
