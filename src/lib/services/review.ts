import { ReviewContentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function scheduleLessonReview(
  userId: string,
  lessonId: string,
  passed: boolean
) {
  const existing = await prisma.reviewQueue.findFirst({
    where: {
      userId,
      lessonId,
      contentType: ReviewContentType.LESSON,
      completedAt: null,
    },
  });

  const intervalDays = passed ? 3 : 1;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  if (existing) {
    return prisma.reviewQueue.update({
      where: { id: existing.id },
      data: {
        dueAt,
        intervalDays,
        contentId: lessonId,
      },
    });
  }

  return prisma.reviewQueue.create({
    data: {
      userId,
      lessonId,
      contentType: ReviewContentType.LESSON,
      contentId: lessonId,
      dueAt,
      intervalDays,
    },
  });
}
