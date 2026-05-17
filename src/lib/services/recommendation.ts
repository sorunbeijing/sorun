import { ProficiencyLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { levelDistance, levelToOrder } from "@/lib/level";
import { ensureUserLessons, formatLesson } from "@/lib/services/lesson-generator";

export interface RecommendationReason {
  priority: number;
  label: string;
  detail: string;
}

export interface ScoredLesson {
  score: number;
  reasons: RecommendationReason[];
}

const IDEAL_DURATION_MIN = 15;
const IDEAL_DURATION_MAX = 25;

const R = {
  continue: { label: "\u7ee7\u7eed\u5b66\u4e60", detail: "\u4f60\u5df2\u5f00\u59cb\u6b64\u8bfe\u7a0b" },
  levelMatch: { label: "\u6c34\u5e73\u5339\u914d", detail: "\u96be\u5ea6\u4e0e\u5f53\u524d\u6c34\u5e73\u4e00\u81f4" },
  levelNear: { label: "\u6c34\u5e73\u63a5\u8fd1", detail: "\u96be\u5ea6\u7565\u9ad8\u4e8e\u6216\u4f4e\u4e8e\u5f53\u524d\u6c34\u5e73" },
  primaryInterest: { label: "\u4e3b\u5174\u8da3\u5339\u914d", detail: "\u7b26\u5408\u4f60\u7684\u4e3b\u8981\u5b66\u4e60\u5174\u8da3" },
  interest: { label: "\u5174\u8da3\u5339\u914d", detail: "\u7b26\u5408\u4f60\u7684\u5b66\u4e60\u5174\u8da3" },
  notRecent: { label: "\u4e45\u672a\u5b66\u4e60", detail: "\u6700\u8fd1\u672a\u5b66\u4e60\u6b64\u4e3b\u9898" },
  themeRepeat: { label: "\u4e3b\u9898\u91cd\u590d", detail: "\u907f\u514d\u4e0e\u4e0a\u4e00\u8bfe\u76f8\u540c\u4e3b\u9898" },
  themeVariety: { label: "\u4e3b\u9898\u591a\u6837", detail: "\u6362\u4e00\u4e2a\u65b0\u4e3b\u9898\u5b66\u4e60" },
  duration: (m: number) => ({ label: "\u65f6\u957f\u9002\u4e2d", detail: `\u7ea6 ${m} \u5206\u949f` }),
  reviewDue: { label: "\u590d\u4e60\u5230\u671f", detail: "\u4f18\u5148\u5b8c\u6210\u5230\u671f\u590d\u4e60" },
};

function scoreLesson(params: {
  userLevel: ProficiencyLevel;
  primaryTagId: string | null;
  userTagIds: string[];
  lastThemeTagId: string | null;
  lesson: {
    id: string;
    level: ProficiencyLevel;
    interestTagIds: string[];
    template: { durationMinutes: number; difficulty: number };
    progress: Array<{ status: string; lastAccessedAt: Date | null }>;
  };
}): ScoredLesson {
  const { userLevel, primaryTagId, userTagIds, lastThemeTagId, lesson } = params;
  const reasons: RecommendationReason[] = [];
  let score = 0;

  const progress = lesson.progress[0];
  const lastAccessed = progress?.lastAccessedAt?.getTime() ?? 0;
  const daysSinceStudy = lastAccessed
    ? (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24)
    : 999;

  if (progress?.status === "IN_PROGRESS") {
    score += 80;
    reasons.push({ priority: 3, ...R.continue });
  }

  const dist = levelDistance(userLevel, lesson.level);
  if (dist === 0) {
    score += 40;
    reasons.push({ priority: 3, ...R.levelMatch });
  } else if (dist === 1) {
    score += 25;
    reasons.push({ priority: 3, ...R.levelNear });
  } else {
    score += Math.max(0, 15 - dist * 8);
  }

  const matchesPrimary =
    primaryTagId && lesson.interestTagIds.includes(primaryTagId);
  const matchesAny = lesson.interestTagIds.some((id) => userTagIds.includes(id));

  if (matchesPrimary) {
    score += 60;
    reasons.push({ priority: 2, ...R.primaryInterest });
  } else if (matchesAny) {
    score += 35;
    reasons.push({ priority: 2, ...R.interest });
  }

  if (daysSinceStudy >= 3 || !progress) {
    score += 30;
    reasons.push({ priority: 4, ...R.notRecent });
  } else {
    score += Math.min(10, daysSinceStudy * 3);
  }

  const themeId = lesson.interestTagIds[0] ?? null;
  if (themeId && lastThemeTagId && themeId === lastThemeTagId) {
    score -= 25;
    reasons.push({ priority: 5, ...R.themeRepeat });
  } else if (themeId !== lastThemeTagId) {
    score += 15;
    reasons.push({ priority: 5, ...R.themeVariety });
  }

  const duration = lesson.template.durationMinutes;
  if (duration >= IDEAL_DURATION_MIN && duration <= IDEAL_DURATION_MAX) {
    score += 20;
    reasons.push({ priority: 6, ...R.duration(duration) });
  } else {
    const diff = Math.min(
      Math.abs(duration - IDEAL_DURATION_MIN),
      Math.abs(duration - IDEAL_DURATION_MAX)
    );
    score += Math.max(0, 20 - diff * 2);
  }

  if (progress?.status === "COMPLETED") {
    score -= 50;
  }

  return {
    score,
    reasons: reasons.sort((a, b) => a.priority - b.priority),
  };
}

export async function getHomeRecommendations(
  userId: string,
  options?: { ensureLessons?: boolean }
) {
  if (options?.ensureLessons !== false) {
    const lessonCount = await prisma.generatedLesson.count({ where: { userId } });
    if (lessonCount === 0) {
      await ensureUserLessons(userId);
    }
  }

  const now = new Date();

  const [user, dueReviews, lessons, lastProgress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, interests: true },
    }),
    prisma.reviewQueue.findMany({
      where: { userId, completedAt: null, dueAt: { lte: now } },
      include: {
        lesson: { include: { template: true, progress: { where: { userId } } } },
      },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.generatedLesson.findMany({
      where: { userId, status: "READY" },
      include: { template: true, progress: { where: { userId } } },
    }),
    prisma.userLessonProgress.findFirst({
      where: { userId, lastAccessedAt: { not: null } },
      orderBy: { lastAccessedAt: "desc" },
      include: { lesson: true },
    }),
  ]);

  if (!user) {
    return { reviews: [], lessons: [], daily: [] };
  }

  const userLevel = user.profile?.level ?? ProficiencyLevel.BEGINNER;
  const primaryTagId = user.profile?.primaryInterestId ?? null;
  const userTagIds = user.interests.map((i) => i.tagId);
  const lastThemeTagId = lastProgress?.lesson.interestTagIds[0] ?? null;

  const scored = lessons.map((lesson) => {
    const { score, reasons } = scoreLesson({
      userLevel,
      primaryTagId,
      userTagIds,
      lastThemeTagId,
      lesson: {
        id: lesson.id,
        level: lesson.level,
        interestTagIds: lesson.interestTagIds,
        template: {
          durationMinutes: lesson.template.durationMinutes,
          difficulty: lesson.template.difficulty,
        },
        progress: lesson.progress,
      },
    });
    return {
      lesson: formatLesson({ ...lesson, progress: lesson.progress }),
      score,
      reasons,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const reviewItems = dueReviews.map((r) => ({
    id: r.id,
    contentType: r.contentType,
    contentId: r.contentId,
    lessonId: r.lessonId,
    dueAt: r.dueAt,
    lesson: r.lesson ? formatLesson({ ...r.lesson, progress: r.lesson.progress }) : null,
    priority: 1000,
    reason: R.reviewDue,
  }));

  const topLessons = scored.slice(0, 10).map((s) => ({
    ...s.lesson,
    score: s.score,
    reasons: s.reasons,
  }));

  const daily = scored
    .filter((s) => s.lesson.progress?.status !== "COMPLETED")
    .slice(0, 3)
    .map((s) => ({ ...s.lesson, score: s.score, reasons: s.reasons }));

  return { reviews: reviewItems, lessons: topLessons, daily };
}

export async function getLessonRecommendationReason(userId: string, lessonId: string) {
  const [user, lesson, lastProgress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, interests: true },
    }),
    prisma.generatedLesson.findFirst({
      where: { id: lessonId, userId },
      include: { template: true, progress: { where: { userId } } },
    }),
    prisma.userLessonProgress.findFirst({
      where: { userId, lastAccessedAt: { not: null } },
      orderBy: { lastAccessedAt: "desc" },
      include: { lesson: true },
    }),
  ]);

  if (!user || !lesson) return null;

  const scored = scoreLesson({
    userLevel: user.profile?.level ?? ProficiencyLevel.BEGINNER,
    primaryTagId: user.profile?.primaryInterestId ?? null,
    userTagIds: user.interests.map((i) => i.tagId),
    lastThemeTagId: lastProgress?.lesson.interestTagIds[0] ?? null,
    lesson: {
      id: lesson.id,
      level: lesson.level,
      interestTagIds: lesson.interestTagIds,
      template: {
        durationMinutes: lesson.template.durationMinutes,
        difficulty: lesson.template.difficulty,
      },
      progress: lesson.progress,
    },
  });

  const userLevel = user.profile?.level ?? "BEGINNER";
  return {
    lessonId,
    score: scored.score,
    reasons: scored.reasons,
    levelHint: `\u4f60\u7684\u6c34\u5e73\uff1a${userLevel}\uff0c\u8bfe\u7a0b\uff1a${lesson.level}`,
    levelOrder: levelToOrder(user.profile?.level ?? ProficiencyLevel.BEGINNER),
  };
}
