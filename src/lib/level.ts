import { ProficiencyLevel } from "@prisma/client";

const levelOrder: Record<ProficiencyLevel, number> = {
  BEGINNER: 0,
  ELEMENTARY: 1,
  INTERMEDIATE: 2,
  UPPER_INTERMEDIATE: 3,
  ADVANCED: 4,
};

export function levelToOrder(level: ProficiencyLevel): number {
  return levelOrder[level];
}

export function levelDistance(
  userLevel: ProficiencyLevel,
  lessonLevel: ProficiencyLevel
): number {
  return Math.abs(levelToOrder(userLevel) - levelToOrder(lessonLevel));
}
