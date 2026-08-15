interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
  frequency: number;
}

function createNode(): TrieNode {
  return { children: new Map(), isEnd: false, frequency: 0 };
}

export class Trie {
  // ← make root accessible to AutocorrectEngine
  root: TrieNode = createNode();
  private totalWords = 0;

  insert(word: string, frequency = 1): void {
    if (!word) return;
    // ← always insert lowercased so has() and getSuggestions() stay consistent
    const normalized = word.toLowerCase();
    let node = this.root;

    for (const char of normalized) {
      if (!node.children.has(char)) {
        node.children.set(char, createNode());
      }
      node = node.children.get(char)!;
    }
    node.isEnd = true;
    node.frequency += frequency;
    this.totalWords++;
  }

  getSuggestions(prefix: string, limit = 5): string[] {
    if (!prefix) return [];
    // ← normalize prefix too
    const normalizedPrefix = prefix.toLowerCase();
    let node = this.root;

    for (const char of normalizedPrefix) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }

    const results: { word: string; freq: number }[] = [];
    this._dfs(node, normalizedPrefix, results, limit);

    return results
      .sort((a, b) => b.freq - a.freq)
      .slice(0, limit)
      .map((r) => r.word);
  }

  private _dfs(node: TrieNode, current: string, results: { word: string; freq: number }[], limit: number): void {
    if (results.length >= limit * 3) return;
    if (node.isEnd) results.push({ word: current, freq: node.frequency });
    for (const [char, child] of node.children) {
      this._dfs(child, current + char, results, limit);
    }
  }

  has(word: string): boolean {
    if (!word) return false;
    let node = this.root;
    // ← normalize for consistent lookup
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char)!;
    }
    return node.isEnd;
  }

  get size(): number {
    return this.totalWords;
  }
}
