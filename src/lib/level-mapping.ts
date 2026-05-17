/** 等级 enum → 日文表示（仅 UI；API/DB 仍为 BEGINNER 等） */

const LEVEL_LABEL_JA: Record<string, string> = {
  BEGINNER: "初心者",
  ELEMENTARY: "初級",
  INTERMEDIATE: "中級",
  UPPER_INTERMEDIATE: "中上級",
  ADVANCED: "上級",
};

export function levelToJapanese(level: string | null | undefined): string {
  if (!level) return LEVEL_LABEL_JA.BEGINNER;
  return LEVEL_LABEL_JA[level] ?? level;
}
