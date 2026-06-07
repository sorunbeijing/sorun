import type { VocabItem } from "./types";

export function v(hanzi: string, pinyin: string, meaning: string): VocabItem {
  return { hanzi, pinyin, meaning };
}
