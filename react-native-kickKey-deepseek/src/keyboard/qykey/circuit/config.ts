// ============================================================
// config.ts — circuit configuration (ported from qykey/helper/data.ts).
// Only the config/directions pieces are needed here; the emoji
// data lives in ../emojiData.
// ============================================================

export const config = () => ({
  cellSize: 10,
  maxWireLength: 40,
  wireColor: '#8594aa',
  bgColor: '#ffffff',
  glowBgColor: '#d9e0ef',
  glowLength: 10,
  glowSpeed: 50,
  straightBias: 2,
});

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
