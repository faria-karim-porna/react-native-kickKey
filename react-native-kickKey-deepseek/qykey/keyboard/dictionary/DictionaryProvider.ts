import { Trie } from "../trie/Trie";
import { AutocorrectEngine } from "../autocorrect/AutocorrectEngine";
import { getEnglishTrie } from "./english-words";
import { getBanglaTrie } from "./bangla-words";

export type SupportedLanguage = "en-US" | "bn-BD";

interface LanguageEngine {
  trie: Trie;
  autocorrect: AutocorrectEngine;
}

const _cache = new Map<SupportedLanguage, LanguageEngine>();

export async function getEngineForLanguage(language: SupportedLanguage): Promise<LanguageEngine> {
  if (_cache.has(language)) {
    return _cache.get(language)!;
  }

  try {
    const trie = language === "en-US" ? await getEnglishTrie() : await getBanglaTrie();
    const autocorrect = new AutocorrectEngine(trie, 2);
    const engine: LanguageEngine = { trie, autocorrect };
    _cache.set(language, engine);
    return engine;
  } catch (e) {
    throw e;
  }
}
