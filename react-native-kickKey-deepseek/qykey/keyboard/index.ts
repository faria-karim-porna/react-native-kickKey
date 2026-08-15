// ============================================================
// index.ts — Public API for keyboard suggestion system
// ============================================================

export { Trie } from "./trie/Trie";
export { dictionaryProvider } from "./dictionary/DictionaryProvider";
export type { Language } from "./dictionary/DictionaryProvider";
export {
  SuggestionEngine,
  enSuggestionEngine,
  bnSuggestionEngine,
} from "./suggestion/SuggestionEngine";
export {
  AutocorrectEngine,
  levenshtein,
  enAutocorrectEngine,
  bnAutocorrectEngine,
} from "./autocorrect/AutocorrectEngine";
export { useKeyboardSuggestions } from "./hooks/useKeyboardSuggestions";
export type {
  KeyboardSuggestionsConfig,
  KeyboardSuggestionsResult,
} from "./hooks/useKeyboardSuggestions";
