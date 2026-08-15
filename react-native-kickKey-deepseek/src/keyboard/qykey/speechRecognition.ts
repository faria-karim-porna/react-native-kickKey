// ============================================================
// speechRecognition.ts — mic-button stub for the keyboard bundle.
//
// The IME process does not register expo-* native modules, and the
// app explicitly blocks RECORD_AUDIO, so real speech recognition is
// not available inside the keyboard. The mic key keeps the qykey UI
// but reports "not available" instead of crashing (same graceful
// fallback qykey uses inside Expo Go).
// ============================================================

export const speechRecognition = {
  /** Start listening. Returns false (not supported in this build). */
  start: (): boolean => {
    console.warn('[KickKey] Speech recognition is not available in this build.');
    return false;
  },
  stop: (): void => {},
  requestPermissionsAsync: async () => ({ granted: false }),
};

export const useSpeechRecognitionEvent = (_event: string, _cb: any) => {};
