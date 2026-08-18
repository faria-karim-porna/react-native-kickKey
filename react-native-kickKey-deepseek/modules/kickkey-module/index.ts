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

  // ── Touchpad ──────────────────────────────────────────────────────────────

  /**
   * Moves the text cursor one step in the given direction using DPAD key events.
   * Call repeatedly (throttled) while the user drags on the touchpad surface.
   * direction: "left" | "right" | "up" | "down"
   */
  moveCursor: (direction: 'left' | 'right' | 'up' | 'down'): Promise<void> =>
    KickKey.moveCursor(direction),

  /**
   * Sends a PAGE_UP or PAGE_DOWN key event to scroll the focused view.
   * direction: "up" | "down"
   */
  scrollPage: (direction: 'up' | 'down'): Promise<void> =>
    KickKey.scrollPage(direction),

  /**
   * Back/Forward navigation.
   * - "backward" → system Back (GLOBAL_ACTION_BACK). Resolves true.
   * - "forward"  → best-effort scroll-forward on the focused node; resolves
   *   false when unsupported (no a11y API for Forward — pro mode in M4).
   */
  navigateHistory: (direction: 'backward' | 'forward'): Promise<boolean> =>
    KickKey.navigateHistory(direction),

  /**
   * Mouse button click at the current cursor position.
   * "left"  → real tap (dispatchGesture) via the accessibility service;
   *           text-field DPAD fallback when the service is off.
   * "right" → long-press at the cursor (context-menu equivalent).
   */
  mouseClick: (button: 'left' | 'right'): Promise<void> =>
    KickKey.mouseClick(button),

  // ── Touchpad: on-screen mouse pointer overlay ────────────────────────────────

  /**
   * Shows a desktop-style mouse pointer over the app screen (TYPE_APPLICATION_OVERLAY).
   * Resolves true when the pointer is visible. Requires "Display over other apps"
   * (SYSTEM_ALERT_WINDOW) — resolves false when the permission is not granted.
   */
  pointerShow: (): Promise<boolean> => KickKey.pointerShow(),

  /** Hides the on-screen mouse pointer overlay. */
  pointerHide: (): Promise<void> => KickKey.pointerHide(),

  /**
   * Moves the on-screen pointer by a RELATIVE (dx, dy) delta, clamped to the
   * visible app area. Called repeatedly while the user drags on the touchpad.
   */
  pointerMove: (dx: number, dy: number): Promise<void> =>
    KickKey.pointerMove(dx, dy),

  /** Opens the system "Display over other apps" settings for this app. */
  openOverlaySettings: (): Promise<void> => KickKey.openOverlaySettings(),

  // ── Touchpad: IME strip mode + drag (M3) ────────────────────────────────

  /** Shrinks the IME window to a thin strip while touchpad mode is active. */
  setTouchpadMode: (on: boolean): Promise<void> => KickKey.setTouchpadMode(on),

  /** L button pressed — arm a drag at the cursor. */
  dragStart: (): Promise<void> => KickKey.dragStart(),

  /** L button released — dispatch a drag stroke (or a tap if nothing moved). */
  dragEnd: (): Promise<void> => KickKey.dragEnd(),

  // ── Accessibility service (M1) ──────────────────────────────────────────

  /** True when KickKeyAccessibilityService is enabled in system accessibility settings. */
  isAccessibilityEnabled: (): Promise<boolean> => KickKey.isAccessibilityEnabled(),

  /** Deep-links to the system accessibility settings screen. */
  openAccessibilitySettings: (): Promise<void> => KickKey.openAccessibilitySettings(),

  /** Shows the floating KickKey panel (a11y service process only). */
  showFloatingPanel: (): Promise<void> => KickKey.showFloatingPanel(),

  /** Hides the floating KickKey panel (used by the panel's close button). */
  hideFloatingPanel: (): Promise<void> => KickKey.hideFloatingPanel(),
};
