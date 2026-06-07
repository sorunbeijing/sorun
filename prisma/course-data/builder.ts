import { ProficiencyLevel } from "@prisma/client";
import { ORIGINAL_LEVEL_DURATION } from "./duration";
import { expandLessonContent } from "./lesson-expander";
import type { DomainSpec, GeneratedLessonPayload } from "./types";
import { ALL_LEVELS } from "./types";

export { v } from "./vocab";

const LEVEL_SLUG: Record<ProficiencyLevel, string> = {
  [ProficiencyLevel.BEGINNER]: "beginner",
  [ProficiencyLevel.ELEMENTARY]: "elementary",
  [ProficiencyLevel.INTERMEDIATE]: "intermediate",
  [ProficiencyLevel.UPPER_INTERMEDIATE]: "upper",
  [ProficiencyLevel.ADVANCED]: "advanced",
};

const LEVEL_DIFFICULTY: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.BEGINNER]: 1,
  [ProficiencyLevel.ELEMENTARY]: 2,
  [ProficiencyLevel.INTERMEDIATE]: 3,
  [ProficiencyLevel.UPPER_INTERMEDIATE]: 4,
  [ProficiencyLevel.ADVANCED]: 5,
};

export function buildDomainLessons(domain: DomainSpec): GeneratedLessonPayload[] {
  const payloads: GeneratedLessonPayload[] = [];

  for (const level of ALL_LEVELS) {
    const spec = domain.lessons[level];
    const levelSlug = LEVEL_SLUG[level];
    const slug = `${domain.slug}-${levelSlug}-lesson`;
    const originalDuration = ORIGINAL_LEVEL_DURATION[level];

    const expanded = expandLessonContent(domain, level, spec, slug, originalDuration);

    payloads.push({
      slug,
      domainSlug: domain.slug,
      title: spec.title,
      description: spec.description,
      baseLevel: level,
      durationMinutes: expanded.durationMinutes,
      difficulty: LEVEL_DIFFICULTY[level],
      contentJson: expanded.contentJson,
      quizJson: expanded.quizJson,
      vocabCount: expanded.vocabCount,
      questionCount: expanded.questionCount,
    });
  }

  return payloads;
}
