import type { KeyDef } from '../types';

/** Compact number layout for TYPE_CLASS_NUMBER fields */
export const NUMBER_ROWS: KeyDef[][] = [
  [
    { label: '1', code: '1', altChars: ['!'] },
    { label: '2', code: '2', altChars: ['@'] },
    { label: '3', code: '3', altChars: ['#'] },
  ],
  [
    { label: '4', code: '4' },
    { label: '5', code: '5', altChars: ['%'] },
    { label: '6', code: '6' },
  ],
  [
    { label: '7', code: '7', altChars: ['&'] },
    { label: '8', code: '8', altChars: ['*'] },
    { label: '9', code: '9' },
  ],
  [
    { label: '.', code: '.', altChars: [',', '-'] },
    { label: '0', code: '0' },
    { label: '⌫', code: '', action: 'backspace', isSpecial: true, icon: 'backspace' },
  ],
];

/** Phone dial-pad layout for TYPE_CLASS_PHONE fields */
export const PHONE_ROWS: KeyDef[][] = [
  [
    { label: '1', code: '1' },
    { label: '2', code: '2' },
    { label: '3', code: '3' },
  ],
  [
    { label: '4', code: '4' },
    { label: '5', code: '5' },
    { label: '6', code: '6' },
  ],
  [
    { label: '7', code: '7' },
    { label: '8', code: '8' },
    { label: '9', code: '9' },
  ],
  [
    { label: '*',  code: '*' },
    { label: '0',  code: '0', altChars: ['+'] },
    { label: '#',  code: '#' },
  ],
  [
    { label: '⌫', code: '', action: 'backspace', isSpecial: true, icon: 'backspace', width: 3 },
  ],
];
