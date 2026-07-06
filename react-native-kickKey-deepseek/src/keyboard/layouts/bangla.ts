import type { KeyDef } from '../types';

/**
 * Bangla phonetic keyboard layout (Avro-style).
 *
 * Each key's label shows the primary Bangla output.
 * The key's code is the Roman character fed to BanglaInputEngine.
 */
export const BANGLA_ROWS: KeyDef[][] = [
  // ── Row 1 ─────────────────────────────────────────────────────────────────
  [
    { label: 'ক',  code: 'k', altChars: ['খ', 'গ', 'ঘ', 'ঙ'] },
    { label: 'ও',  code: 'o', altChars: ['ওয়া', 'ঔ'] },
    { label: 'এ',  code: 'e', altChars: ['ঐ'] },
    { label: 'র',  code: 'r', altChars: ['ড়', 'ঢ়'] },
    { label: 'ত',  code: 't', altChars: ['থ', 'ট', 'ঠ'] },
    { label: 'য',  code: 'y', altChars: ['য়', 'ইয়'] },
    { label: 'উ',  code: 'u', altChars: ['ঊ', 'ু', 'ূ'] },
    { label: 'ই',  code: 'i', altChars: ['ঈ', 'ি', 'ী'] },
    { label: 'অ',  code: 'a', altChars: ['আ', 'া'] },
    { label: 'প',  code: 'p', altChars: ['ফ'] },
  ],

  // ── Row 2 ─────────────────────────────────────────────────────────────────
  [
    { label: 'অ',  code: 'a', altChars: ['আ', 'া'] },
    { label: 'স',  code: 's', altChars: ['শ', 'ষ'] },
    { label: 'দ',  code: 'd', altChars: ['ধ', 'ড', 'ঢ'] },
    { label: 'ফ',  code: 'f', altChars: ['ফ'] },
    { label: 'গ',  code: 'g', altChars: ['ঘ'] },
    { label: 'হ',  code: 'h', altChars: ['ঃ'] },
    { label: 'জ',  code: 'j', altChars: ['ঝ'] },
    { label: 'ক',  code: 'k', altChars: ['খ', 'ঘ'] },
    { label: 'ল',  code: 'l', altChars: ['ল'] },
  ],

  // ── Row 3 ─────────────────────────────────────────────────────────────────
  [
    {
      label: '⇧', shiftLabel: '⇪', code: '',
      action: 'shift', width: 1.5, isSpecial: true, icon: 'shift',
    },
    { label: 'য়', code: 'z', altChars: ['য়'] },
    { label: 'ক্ষ', code: 'x', altChars: ['ক্ষ'] },
    { label: 'চ',  code: 'c', altChars: ['ছ'] },
    { label: 'ভ',  code: 'v', altChars: ['ব'] },
    { label: 'ব',  code: 'b', altChars: ['ভ'] },
    { label: 'ন',  code: 'n', altChars: ['ণ', 'ং', 'ঁ'] },
    { label: 'ম',  code: 'm', altChars: ['ম'] },
    {
      label: '⌫', code: '',
      action: 'backspace', width: 1.5, isSpecial: true, icon: 'backspace',
    },
  ],
];
