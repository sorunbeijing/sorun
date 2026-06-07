import type { ProficiencyLevel } from "@prisma/client";

export const ALL_LEVELS: ProficiencyLevel[] = [
  "BEGINNER",
  "ELEMENTARY",
  "INTERMEDIATE",
  "UPPER_INTERMEDIATE",
  "ADVANCED",
] as ProficiencyLevel[];

export type VocabItem = {
  hanzi: string;
  pinyin: string;
  meaning: string;
};

export type DialogueLine = {
  speaker: string;
  text: string;
  pinyin: string;
  meaning: string;
};

export type LevelLessonSpec = {
  title: string;
  description: string;
  objectives: string[];
  vocab: VocabItem[];
  dialogue: DialogueLine[];
};

export type DomainSpec = {
  slug: string;
  nameZh: string;
  nameJa: string;
  category: string;
  icon: string;
  sortOrder: number;
  lessons: Record<ProficiencyLevel, LevelLessonSpec>;
};

export type GeneratedLessonPayload = {
  slug: string;
  domainSlug: string;
  title: string;
  description: string;
  baseLevel: ProficiencyLevel;
  durationMinutes: number;
  difficulty: number;
  contentJson: Record<string, unknown>;
  quizJson: Record<string, unknown>;
  vocabCount: number;
  questionCount: number;
};
