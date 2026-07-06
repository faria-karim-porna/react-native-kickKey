import { NativeModules } from 'react-native';

const { KickKey } = NativeModules;

export default {
  // ── Phase 1 (carried over) ────────────────────────────────────────────────
  isDefaultKeyboard:   (): Promise<boolean> => KickKey.isDefaultKeyboard(),
  isKeyboardEnabled:   (): Promise<boolean> => KickKey.isKeyboardEnabled(),
  openKeyboardSettings:(): void             => KickKey.openKeyboardSettings(),

  // ── Phase 2 (new) ─────────────────────────────────────────────────────────

  /**
   * Commits a character to the currently focused text field.
   * @param code   The character string to insert (e.g. 'a', 'A', '!', ' ')
   * @param language  'en' or 'bn' — Bangla routing added in Phase 3
   */
  commitKey: (code: string, language: string): Promise<void> =>
    KickKey.commitKey(code, language),

  /**
   * Deletes the character immediately before the cursor.
   */
  sendBackspace: (): Promise<void> =>
    KickKey.sendBackspace(),

  /**
   * Commits a space. Phase 4 upgrades this to auto-commit top suggestion.
   */
  commitSpace: (): Promise<void> =>
    KickKey.commitSpace(),

  /**
   * Sends an Enter key event to the focused field.
   */
  sendEnter: (): Promise<void> =>
    KickKey.sendEnter(),

  /**
   * Returns current keyboard preferences (theme, layout, haptic flags, etc.)
   * Used by useKeyboardTheme on mount.
   */
  getPreferences: (): Promise<Record<string, any>> =>
    KickKey.getPreferences(),

  /**
   * Persists preferences so the keyboard reads them on next open.
   * Called by companion app (Phase 5).
   */
  savePreferences: (prefs: Record<string, any>): Promise<void> =>
    KickKey.savePreferences(prefs),
};
