import type { KeyDef } from '../types';

export const SYMBOL_ROWS: KeyDef[][] = [
  // Row 1 — numbers
  [
    { label: '1', code: '1', altChars: ['¹', '½'] },
    { label: '2', code: '2', altChars: ['²', '⅔'] },
    { label: '3', code: '3', altChars: ['³', '¾'] },
    { label: '4', code: '4', altChars: ['£'] },
    { label: '5', code: '5', altChars: ['€', '$'] },
    { label: '6', code: '6', altChars: ['¥'] },
    { label: '7', code: '7', altChars: ['&'] },
    { label: '8', code: '8', altChars: ['∞'] },
    { label: '9', code: '9', altChars: ['('] },
    { label: '0', code: '0', altChars: [')'] },
  ],
  // Row 2 — punctuation
  [
    { label: '@',  code: '@'  },
    { label: '#',  code: '#'  },
    { label: '$',  code: '$'  },
    { label: '%',  code: '%'  },
    { label: '&',  code: '&'  },
    { label: '-',  code: '-', altChars: ['_', '—', '–'] },
    { label: '+',  code: '+', altChars: ['±'] },
    { label: '(',  code: '('  },
    { label: ')',  code: ')'  },
  ],
  // Row 3 — more symbols
  [
    { label: 'ABC', code: '', action: 'symbols_back', width: 1.5, isSpecial: true },
    { label: '*',   code: '*' },
    { label: '"',   code: '"', altChars: ['"', '"'] },
    { label: "'",   code: "'", altChars: ['\'', '\''] },
    { label: ':',   code: ':' },
    { label: ';',   code: ';' },
    { label: '!',   code: '!' },
    { label: '?',   code: '?', altChars: ['¿'] },
    { label: '⌫',   code: '', action: 'backspace', width: 1.5, isSpecial: true, icon: 'backspace' },
  ],
];
