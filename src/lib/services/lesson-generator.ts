import type { Prisma } from "@prisma/client";
import { ProficiencyLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function ensureUserLessons(userId: string) {
  const [user, templates, existingLessons] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        interests: { include: { tag: true } },
      },
    }),
    prisma.lessonTemplate.findMany({
      where: { isActive: true },
      include: { themeVariants: { include: { themeTag: true } } },
    }),
    prisma.generatedLesson.findMany({
      where: { userId },
      select: { templateId: true, themeVariantId: true },
    }),
  ]);

  if (!user) return [];

  const existingKeys = new Set(
    existingLessons.map((l) => `${l.templateId}:${l.themeVariantId ?? ""}`)
  );

  const tagIds = user.interests.map((i) => i.tagId);
  const primaryTagId =
    user.profile?.primaryInterestId ?? user.interests.find((i) => i.isPrimary)?.tagId;

  const toCreate: Prisma.GeneratedLessonCreateManyInput[] = [];

  for (const template of templates) {
    const matchingVariants = template.themeVariants.filter((v) =>
      tagIds.length === 0 ? true : tagIds.includes(v.themeTagId)
    );

    const variant =
      matchingVariants.find((v) => v.themeTagId === primaryTagId) ??
      matchingVariants[0] ??
      null;

    const key = `${template.id}:${variant?.id ?? ""}`;
    if (existingKeys.has(key)) continue;

    const title = variant?.titleOverride ?? template.title;
    const interestTagIds = variant
      ? [variant.themeTagId]
      : tagIds.length > 0
        ? tagIds.slice(0, 2)
        : [];

    const contentJson = template.contentJson as Prisma.JsonObject;
    const patchedContent = variant?.contentPatchJson
      ? { ...contentJson, theme: variant.themeTag.nameZh }
      : contentJson;

    toCreate.push({
      userId,
      templateId: template.id,
      themeVariantId: variant?.id ?? null,
      title,
      interestTagIds,
      level: template.baseLevel,
      contentJson: patchedContent as Prisma.InputJsonValue,
      quizJson: template.quizJson as Prisma.InputJsonValue,
    });
  }

  if (toCreate.length === 0) return [];

  await prisma.generatedLesson.createMany({ data: toCreate });
  return toCreate.map((_, i) => `created-${i}`);
}

export function formatLesson(lesson: {
  id: string;
  title: string;
  level: ProficiencyLevel;
  interestTagIds: string[];
  contentJson: unknown;
  quizJson: unknown;
  status: string;
  createdAt: Date;
  templateId: string;
  themeVariantId: string | null;
  template?: { slug: string; description: string; durationMinutes: number; difficulty: number };
  progress?: Array<{
    status: string;
    progressPercent: number;
    currentStep: number;
    lastAccessedAt: Date | null;
  }>;
}) {
  const progress = lesson.progress?.[0];
  return {
    id: lesson.id,
    title: lesson.title,
    level: lesson.level,
    interestTagIds: lesson.interestTagIds,
    status: lesson.status,
    createdAt: lesson.createdAt,
    templateId: lesson.templateId,
    themeVariantId: lesson.themeVariantId,
    description: lesson.template?.description,
    durationMinutes: lesson.template?.durationMinutes,
    difficulty: lesson.template?.difficulty,
    slug: lesson.template?.slug,
    progress: progress
      ? {
          status: progress.status,
          progressPercent: progress.progressPercent,
          currentStep: progress.currentStep,
          lastAccessedAt: progress.lastAccessedAt,
        }
      : null,
  };
}
