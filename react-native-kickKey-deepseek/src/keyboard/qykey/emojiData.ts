// ============================================================
// emojiData.ts — emoji categories + glyph lists for EmojiBoard.
// Re-exported from the qykey reference implementation so the
// keyboard uses the exact same emoji set as the qykey UI.
//
// Fixes applied on top of the reference data:
//   - corrupted glyphs corrected in qykey/helper/data.ts
//     (👂 and 🧗 were mangled into CJK characters 耳 / 攀)
//   - duplicate entries within a category are removed here so
//     FlatList keys stay unique — duplicate keys made FlatList
//     drop items, which showed up as "missing" emojis.
// ============================================================

import { emojis as rawEmojis, emojiCategories } from '../../../qykey/helper/data';

const dedupe = (list: string[]): string[] => [...new Set(list)];

export const emojis = (): Record<string, string[]> => {
  const all = rawEmojis();
  const out: Record<string, string[]> = {};
  for (const key of Object.keys(all)) {
    out[key] = dedupe(all[key]);
  }
  return out;
};

export { emojiCategories };
