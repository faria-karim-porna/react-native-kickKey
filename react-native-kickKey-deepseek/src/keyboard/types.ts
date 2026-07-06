export interface KeyDef {
  /** Display label shown on the key (lowercase by default) */
  label: string;
  /** Display label when Shift is active */
  shiftLabel?: string;
  /** The character string committed to InputConnection on press */
  code: string;
  /** Relative flex width multiplier. Default: 1 */
  width?: number;
  /** Characters shown in the long-press popup */
  altChars?: string[];
  /** Icon identifier for special keys ('shift', 'backspace', 'enter') */
  icon?: KeyIcon;
  /** Special action this key triggers instead of committing a character */
  action?: KeyAction;
  /** Whether this key uses the special key background color */
  isSpecial?: boolean;
}

export type KeyIcon = 'shift' | 'backspace' | 'enter';

export type KeyAction =
  | 'backspace'
  | 'space'
  | 'enter'
  | 'shift'
  | 'language_switch'
  | 'emoji'
  | 'clipboard'
  | 'symbols'
  | 'symbols_back';

export interface Theme {
  // Colors
  keyboardBg: string;
  keyBg: string;
  keyText: string;
  specialKeyBg: string;
  specialKeyText: string;
  altText: string;
  suggestionBg: string;
  suggestionText: string;
  suggestionDivider: string;
  keyShadow: string;
  popupBg: string;
  popupText: string;
  // Dimensions
  keyHeight: number;
  keyBorderRadius: number;
  keyFontSize: number;
  keyMargin: number;
}
