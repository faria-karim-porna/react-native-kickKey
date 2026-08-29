// ============================================================
// config.ts — circuit configuration (ported from qykey/helper/data.ts).
// Now accepts themeColors for dark mode support.
// ============================================================

import type { KeyboardThemeColors } from '../../hooks/useKeyboardTheme';

export const config = (themeColors?: KeyboardThemeColors) => {
  const isDark = themeColors?.keyText === '#eceff4';
  return {
    cellSize: 10,
    maxWireLength: 40,
    wireColor: themeColors?.themePrimary || '#8594aa',
    bgColor: isDark ? '#242933' : '#ffffff',
    glowBgColor: isDark ? '#3b4252' : '#d9e0ef',
    glowLength: 10,
    glowSpeed: 50,
    straightBias: 2,
  };
};

export const directions = () => [
  [0, 1], // down
  [1, 1], // down-right
  [1, 0], // right
  [1, -1], // up-right
  [0, -1], // up
  [-1, -1], // up-left
  [-1, 0], // left
  [-1, 1], // down-left
];
