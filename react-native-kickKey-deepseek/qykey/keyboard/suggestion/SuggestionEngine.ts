// ============================================================
// SuggestionEngine.ts — Prefix-based word suggestions via Trie
// ============================================================

import { Trie } from "../trie/Trie";
import { dictionaryProvider, Language } from "../dictionary/DictionaryProvider";

const DEFAULT_TOP_N = 5;
const MIN_PREFIX_LENGTH = 1;

/** Cache recently used prefixes to avoid re-traversal */
const suggestionCache = new Map<string, string[]>();
const CACHE_MAX_SIZE = 200;

function cacheSet(key: string, value: string[]): void {
  if (suggestionCache.size >= CACHE_MAX_SIZE) {
    // Evict oldest entry
    suggestionCache.delete(suggestionCache.keys().next().value!);
  }
  suggestionCache.set(key, value);
}

export class SuggestionEngine {
  private trie: Trie | null = null;
  private language: Language = "en";
  private ready = false;

  init(language: Language, maxWords?: number): void {
    this.language = language;
    this.trie = dictionaryProvider.loadDictionary({ language, maxWords });
    this.ready = true;
    suggestionCache.clear();
  }

  /** Get top N suggestions for a prefix */
  getSuggestions(prefix: string, topN = DEFAULT_TOP_N): string[] {
    if (!this.ready || !this.trie) return [];
    if (prefix.length < MIN_PREFIX_LENGTH) return [];

    const normalized = prefix.toLowerCase().trim();
    if (!normalized) return [];

    const cacheKey = `${this.language}:${normalized}:${topN}`;
    if (suggestionCache.has(cacheKey)) {
      return suggestionCache.get(cacheKey)!;
    }

    const results = this.trie.getSuggestions(normalized, topN);
    cacheSet(cacheKey, results);
    return results;
  }

  /** Return exact match check */
  isValidWord(word: string): boolean {
    return this.trie?.has(word.toLowerCase()) ?? false;
  }

  get isReady(): boolean {
    return this.ready;
  }
}

// Singleton instances per language
export const enSuggestionEngine = new SuggestionEngine();
export const bnSuggestionEngine = new SuggestionEngine();
