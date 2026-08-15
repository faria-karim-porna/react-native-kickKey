import { useState, useEffect, useCallback, useRef } from "react";
import { getEngineForLanguage, SupportedLanguage } from "../dictionary/DictionaryProvider";
import { Trie } from "../trie/Trie";
import { AutocorrectEngine } from "../autocorrect/AutocorrectEngine";

interface UseKeyboardSuggestionsResult {
  suggestions: string[];
  getImmediateCorrection: (word: string) => string | null;
  isReady: boolean;
}

const SUGGESTION_LIMIT = 5;

function getLastWord(input: string): string {
  if (!input || typeof input !== "string") return "";
  const match = input.match(/[\p{L}\p{M}]+$/u);
  return match ? match[0] : "";
}

export function useKeyboardSuggestions(input: string | undefined, language: SupportedLanguage): UseKeyboardSuggestionsResult {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  const engineRef = useRef<{ trie: Trie; autocorrect: AutocorrectEngine } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load engine once per language ──────────────────────────────────────────
  useEffect(() => {
    setIsReady(false);
    setSuggestions([]);
    engineRef.current = null;

    getEngineForLanguage(language)
      .then((engine) => {
        engineRef.current = engine;
        setIsReady(true);
      })
      .catch((e) => {
        console.error("Engine load FAILED:", e);
      });
  }, [language]);

  // ─── Debounced suggestions — runs on every keystroke ────────────────────────
  useEffect(() => {
    if (!isReady || !engineRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (!engineRef.current) return;
      const { trie, autocorrect } = engineRef.current;
      const safeInput = input ?? "";
      const lastWord = getLastWord(safeInput);

      if (!lastWord || lastWord.length < 1) {
        setSuggestions([]);
        return;
      }

      const lower = lastWord.toLowerCase();

      // ── Trie prefix suggestions ──────────────────────────────────────────
      const trieSuggestions = trie.getSuggestions(lower, SUGGESTION_LIMIT);

      // ── Autocorrect: best correction for current partial word ────────────
      // Only suggest correction if the word is not already a valid prefix
      const correction = autocorrect.getCorrection(lower);

      // ── Merge: correction first if it differs from top trie suggestion ───
      let finalSuggestions: string[];
      if (correction && correction !== lower && !trieSuggestions.includes(correction)) {
        finalSuggestions = [correction, ...trieSuggestions].slice(0, SUGGESTION_LIMIT);
      } else {
        finalSuggestions = trieSuggestions;
      }

      setSuggestions(finalSuggestions);
    }, 60);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, isReady]);

  // ─── Synchronous correction for direct use ────────────────────────────────
  const getImmediateCorrection = useCallback((word: string): string | null => {
    if (!engineRef.current || !word || word.length < 1) return null;
    return engineRef.current.autocorrect.getCorrection(word);
  }, []);

  return { suggestions, getImmediateCorrection, isReady };
}
