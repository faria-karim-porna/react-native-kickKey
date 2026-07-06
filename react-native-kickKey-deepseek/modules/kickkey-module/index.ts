import { NativeModules } from 'react-native';

const { KickKey } = NativeModules;

export default {
  // ── Phase 1 ───────────────────────────────────────────────────────────────
  isDefaultKeyboard:    (): Promise<boolean>            => KickKey.isDefaultKeyboard(),
  isKeyboardEnabled:    (): Promise<boolean>            => KickKey.isKeyboardEnabled(),
  openKeyboardSettings: (): void                        => KickKey.openKeyboardSettings(),

  // ── Phase 2 ───────────────────────────────────────────────────────────────
  commitKey:       (code: string, language: string): Promise<void> => KickKey.commitKey(code, language),
  sendBackspace:   (): Promise<void>                               => KickKey.sendBackspace(),
  commitSpace:     (): Promise<void>                               => KickKey.commitSpace(),
  sendEnter:       (): Promise<void>                               => KickKey.sendEnter(),
  getPreferences:  (): Promise<Record<string, any>>               => KickKey.getPreferences(),
  savePreferences: (p: Record<string, any>): Promise<void>        => KickKey.savePreferences(p),

  // ── Phase 3 ───────────────────────────────────────────────────────────────
  flushBanglaBuffer: (): Promise<void>              => KickKey.flushBanglaBuffer(),
  setBanglaEnabled:  (e: boolean): Promise<void>    => KickKey.setBanglaEnabled(e),

  // ── Phase 4 (new) ─────────────────────────────────────────────────────────

  /**
   * Replaces the current partial word with [word] + space.
   * Records the choice in UserWordModel for future frequency boosting.
   * Called when the user taps a suggestion chip in SuggestionBar.
   */
  commitSuggestion: (word: string): Promise<void> =>
    KickKey.commitSuggestion(word),
};
