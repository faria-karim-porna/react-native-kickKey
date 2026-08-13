import { NativeModules } from 'react-native';

const { KickKey } = NativeModules;

export default {
  // ── Phase 1 ───────────────────────────────────────────────────────────────
  isDefaultKeyboard:    (): Promise<boolean>            => KickKey.isDefaultKeyboard(),
  isKeyboardEnabled:    (): Promise<boolean>            => KickKey.isKeyboardEnabled(),
  openKeyboardSettings: (): void                        => KickKey.openKeyboardSettings(),

  /** Shows the system "Choose input method" picker to set the current keyboard. */
  showInputMethodPicker: (): void                       => KickKey.showInputMethodPicker(),

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

  // ── Phase 4 ───────────────────────────────────────────────────────────────

  /**
   * Replaces the current partial word with [word] + space.
   * Records the choice in UserWordModel for future frequency boosting.
   * Called when the user taps a suggestion chip in SuggestionBar.
   */
  commitSuggestion: (word: string): Promise<void> =>
    KickKey.commitSuggestion(word),

  // ── Phase 5: Custom dictionary ─────────────────────────────────────────────

  /** Replaces the entire custom dictionary with [words]. */
  setDictionaryWords: (words: string[]): Promise<void> =>
    KickKey.setDictionaryWords(words),

  /** Returns the current custom dictionary word list. */
  getDictionaryWords: (): Promise<string[]> =>
    KickKey.getDictionaryWords(),

  /** Removes a single word from the custom dictionary. */
  removeDictionaryWord: (word: string): Promise<void> =>
    KickKey.removeDictionaryWord(word),

  // ── Phase 6: Clipboard & Emoji history ───────────────────────────────────────

  /** Returns clipboard history, most recent first. */
  getClipboardHistory: (): Promise<string[]> =>
    KickKey.getClipboardHistory(),

  /** Clears the entire clipboard history. */
  clearClipboardHistory: (): Promise<void> =>
    KickKey.clearClipboardHistory(),

  /** Removes a single clipboard history entry. */
  removeClipboardItem: (text: string): Promise<void> =>
    KickKey.removeClipboardItem(text),

  /** Returns the recently used emoji list, most recent first. */
  getRecentEmojis: (): Promise<string[]> =>
    KickKey.getRecentEmojis(),

  /** Records that the user selected an emoji, for recent-tray ordering. */
  recordEmojiUsed: (emoji: string): Promise<void> =>
    KickKey.recordEmojiUsed(emoji),
};
