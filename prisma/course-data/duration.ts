import { ProficiencyLevel } from "@prisma/client";

/** 原始单元耗时（分钟）— 扩充前基准 */
export const UNIT_MINUTES_ORIGINAL = {
  intro: 2,
  vocabItem: 1,
  exampleItem: 1.5,
  dialogueLine: 1,
  reviewItem: 0.5,
  summary: 1,
  quizQuestion: 1.5,
} as const;

/** 单元耗时减半后（分钟） */
export const UNIT_MINUTES = {
  intro: UNIT_MINUTES_ORIGINAL.intro / 2,
  vocabItem: UNIT_MINUTES_ORIGINAL.vocabItem / 2,
  exampleItem: UNIT_MINUTES_ORIGINAL.exampleItem / 2,
  dialogueLine: UNIT_MINUTES_ORIGINAL.dialogueLine / 2,
  reviewItem: UNIT_MINUTES_ORIGINAL.reviewItem / 2,
  summary: UNIT_MINUTES_ORIGINAL.summary / 2,
  quizQuestion: UNIT_MINUTES_ORIGINAL.quizQuestion / 2,
} as const;

/** 各等级原始课程总时长（扩充前） */
export const ORIGINAL_LEVEL_DURATION: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.BEGINNER]: 10,
  [ProficiencyLevel.ELEMENTARY]: 12,
  [ProficiencyLevel.INTERMEDIATE]: 15,
  [ProficiencyLevel.UPPER_INTERMEDIATE]: 20,
  [ProficiencyLevel.ADVANCED]: 25,
};

export const CONTENT_EXPANSION_FACTOR = 5;

export type ContentCounts = {
  vocabCount: number;
  exampleCount: number;
  dialogueCount: number;
  reviewCount: number;
  quizCount: number;
  stepCount: number;
};

/** 按扩充后内容量 + 减半单元时间，估算最终总时长（≈ 原始 × 2.5） */
export function calculateDurationMinutes(
  level: ProficiencyLevel,
  _counts?: ContentCounts
): number {
  return Math.round(ORIGINAL_LEVEL_DURATION[level] * 2.5);
}

export function targetCount(baseCount: number, min = 1): number {
  return Math.max(min, Math.ceil(baseCount * CONTENT_EXPANSION_FACTOR));
}
