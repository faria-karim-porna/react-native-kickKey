/**
 * Removes the last user-perceived character (grapheme cluster) from a string.
 * Correctly handles multi-codepoint Unicode emojis, ZWJ sequences, skin tone
 * modifiers, variation selectors (\uFE0F), flags, and keycaps in a single operation.
 */
export function removeLastGrapheme(str: string): string {
  if (!str) return "";

  // 1. Native Intl.Segmenter (Standard in modern JS / Hermes in React Native)
  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter(undefined, {
      granularity: "grapheme",
    });
    const segments = Array.from(segmenter.segment(str));
    if (segments.length === 0) return "";
    return segments.slice(0, -1).map((s: any) => s.segment).join("");
  }

  // 2. Fallback parser for grapheme clusters (surrogate pairs + ZWJ + variation selectors + modifiers)
  const graphemes: string[] = [];
  let i = 0;

  while (i < str.length) {
    let charLength = 1;
    const code = str.charCodeAt(i);

    // Surrogate pair check
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      charLength = 2;
    }

    let end = i + charLength;

    // Consume combining marks, variation selectors, skin tone modifiers, ZWJ sequences
    while (end < str.length) {
      const nextCode = str.codePointAt(end) || 0;
      if (
        nextCode === 0x200d || // ZWJ
        (nextCode >= 0xfe00 && nextCode <= 0xfe0f) || // Variation selector
        (nextCode >= 0x1f3fb && nextCode <= 0x1f3ff) || // Skin tone modifier
        (nextCode >= 0xe0020 && nextCode <= 0xe007f) || // Tag specifiers
        (nextCode >= 0x1f1e6 && nextCode <= 0x1f1ff) || // Regional indicators (Flags)
        (nextCode >= 0x0300 && nextCode <= 0x036f) // Combining diacritical marks
      ) {
        end += nextCode > 0xffff ? 2 : 1;
      } else {
        break;
      }
    }

    graphemes.push(str.slice(i, end));
    i = end;
  }

  return graphemes.slice(0, -1).join("");
}
