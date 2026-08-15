import * as FileSystem from "expo-file-system/legacy"; // ← only change
import { Asset } from "expo-asset";
import { Trie } from "../trie/Trie";

const BANGLA_ASSET = require("../../assets/bangla_words.txt");

let _trie: Trie | null = null;

export async function getBanglaTrie(): Promise<Trie> {
  if (_trie) return _trie;

  let asset;
  try {
    [asset] = await Asset.loadAsync(BANGLA_ASSET);
  } catch (e) {
    throw e;
  }

  if (!asset.localUri) {
    console.error("localUri is null — asset not bundled correctly");
    throw new Error("Failed to load Bangla word list");
  }

  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: "utf8",
    });
  } catch (e) {
    console.error("readAsStringAsync failed:", e);
    throw e;
  }

  _trie = new Trie();

  const words = raw
    .split("\n")
    .map((w) => w.trim())
    .map((w) => w.replace(/\r/g, ""))
    .filter((w) => Array.from(w).length >= 2);

  for (const word of words) {
    _trie.insert(word);
  }

  return _trie;
}
