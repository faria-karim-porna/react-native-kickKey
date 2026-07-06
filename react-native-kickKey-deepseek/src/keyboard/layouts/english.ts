import type { KeyDef } from '../types';

export const ENGLISH_ROWS: KeyDef[][] = [
  // Row 1
  [
    { label: 'q', code: 'q', altChars: ['1', '!', '`'] },
    { label: 'w', code: 'w', altChars: ['2', '@'] },
    { label: 'e', code: 'e', altChars: ['3', 'è', 'é', 'ê', 'ë'] },
    { label: 'r', code: 'r', altChars: ['4'] },
    { label: 't', code: 't', altChars: ['5'] },
    { label: 'y', code: 'y', altChars: ['6', 'ý'] },
    { label: 'u', code: 'u', altChars: ['7', 'ü', 'ú', 'ù'] },
    { label: 'i', code: 'i', altChars: ['8', 'ï', 'í', 'î'] },
    { label: 'o', code: 'o', altChars: ['9', 'ö', 'ó', 'ô'] },
    { label: 'p', code: 'p', altChars: ['0'] },
  ],
  // Row 2
  [
    { label: 'a', code: 'a', altChars: ['à', 'á', 'â', 'ä', 'å'] },
    { label: 's', code: 's', altChars: ['ß', 'š'] },
    { label: 'd', code: 'd', altChars: ['ð'] },
    { label: 'f', code: 'f' },
    { label: 'g', code: 'g' },
    { label: 'h', code: 'h' },
    { label: 'j', code: 'j' },
    { label: 'k', code: 'k' },
    { label: 'l', code: 'l' },
  ],
  // Row 3
  [
    { label: '⇧', shiftLabel: '⇪', code: '', action: 'shift',     width: 1.5, isSpecial: true, icon: 'shift' },
    { label: 'z', code: 'z' },
    { label: 'x', code: 'x' },
    { label: 'c', code: 'c', altChars: ['ç'] },
    { label: 'v', code: 'v' },
    { label: 'b', code: 'b' },
    { label: 'n', code: 'n', altChars: ['ñ'] },
    { label: 'm', code: 'm' },
    { label: '⌫', code: '', action: 'backspace', width: 1.5, isSpecial: true, icon: 'backspace' },
  ],
];
