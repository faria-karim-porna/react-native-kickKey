import { useState, useCallback, useMemo } from "react";
import { banglishMap } from "./banglishMap";

// Build a prefix index at module load time (runs once, very fast)
// prefix → Set of matching keys
const prefixIndex = new Map<string, string[]>();

for (const key of Object.keys(banglishMap)) {
  for (let i = 1; i <= key.length; i++) {
    const prefix = key.slice(0, i);
    if (!prefixIndex.has(prefix)) prefixIndex.set(prefix, []);
    prefixIndex.get(prefix)!.push(key);
  }
}

export function useBanglish(inputValue: string, onCommit: (newInput: string) => void) {
  // Suggestions derived directly from current word — no extra state needed
  const currentWord = useMemo(() => {
    const words = inputValue.split(/\s+/);
    return words[words.length - 1].toLowerCase();
  }, [inputValue]);

  const suggestions = useMemo(() => {
    if (!currentWord) return [];

    const matchingKeys = prefixIndex.get(currentWord) ?? [];

    // Exact match first, then prefix matches
    const exact: string[] = [];
    const prefix: string[] = [];

    for (const key of matchingKeys) {
      const banglaWords = banglishMap[key];
      if (key === currentWord) {
        exact.push(...banglaWords);
      } else {
        prefix.push(...banglaWords);
      }
    }

    // Deduplicate and limit to 5
    return [...new Set([...exact, ...prefix])].slice(0, 5);
  }, [currentWord]);

  const commitSuggestion = useCallback(
    (banglaWord: string) => {
      // Replace the last word in inputValue with the chosen Bangla word
      const parts = inputValue.split(/(\s+)/);
      // parts alternates: word, whitespace, word, whitespace...
      // Replace the last non-empty segment
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].trim().length > 0) {
          parts[i] = banglaWord;
          break;
        }
      }
      onCommit(parts.join("") + " ");
    },
    [inputValue, onCommit],
  );

  return { suggestions, currentWord, commitSuggestion };
}
