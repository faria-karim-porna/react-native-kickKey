import { Trie } from "../trie/Trie";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export interface CorrectionCandidate {
  word: string;
  distance: number;
  frequency: number;
}

export class AutocorrectEngine {
  private trie: Trie;
  private threshold: number;

  constructor(trie: Trie, threshold = 2) {
    this.trie = trie;
    this.threshold = threshold;
  }

  getCorrection(word: string): string | null {
    const lower = word.toLowerCase();

    if (this.trie.has(lower)) return null;

    const candidates = this._getCandidates(lower);
    if (candidates.length === 0) return null;

    const best = candidates[0];
    if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      return best.word.charAt(0).toUpperCase() + best.word.slice(1);
    }
    return best.word;
  }

  private _getCandidates(word: string): CorrectionCandidate[] {
    const results: CorrectionCandidate[] = [];
    const len = word.length;
    const initialRow = Array.from({ length: len + 1 }, (_, i) => i);

    this._searchRecursive(this.trie.root, "", word, initialRow, results);

    // ── Sort by distance first, then by frequency descending as tiebreaker ──
    return results.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.frequency - a.frequency; // higher frequency wins ties
    });
  }

  private _searchRecursive(node: any, current: string, word: string, prevRow: number[], results: CorrectionCandidate[]): void {
    const len = word.length;

    for (const [char, child] of node.children as Map<string, any>) {
      const currentRow: number[] = [prevRow[0] + 1];

      for (let col = 1; col <= len; col++) {
        const insertCost = currentRow[col - 1] + 1;
        const deleteCost = prevRow[col] + 1;
        const replaceCost = word[col - 1] === char ? prevRow[col - 1] : prevRow[col - 1] + 1;
        currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
      }

      const distance = currentRow[len];
      const candidate = current + char;

      if (child.isEnd && distance <= this.threshold) {
        // ── Include frequency so we can rank by it ──────────────────────────
        results.push({ word: candidate, distance, frequency: child.frequency });
      }

      if (Math.min(...currentRow) <= this.threshold) {
        this._searchRecursive(child, candidate, word, currentRow, results);
      }
    }
  }
}
