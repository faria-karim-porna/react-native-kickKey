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

  // ── Phase 3 (new) ─────────────────────────────────────────────────────────

  /**
   * Commit any Roman characters buffered in BanglaInputEngine as plain text.
   * Call before: language switch, field focus change, emoji/symbol panel open.
   */
  flushBanglaBuffer: (): Promise<void> =>
    KickKey.flushBanglaBuffer(),

  /**
   * Enable or disable the Bangla phonetic engine.
   * When disabled, commitKey in 'bn' mode falls back to direct text commit.
   */
  setBanglaEnabled: (enabled: boolean): Promise<void> =>
    KickKey.setBanglaEnabled(enabled),
};
