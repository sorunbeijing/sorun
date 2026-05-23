export const dynamic = "force-dynamic";
import { LearningEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: { content_id: string } }
) {
  try {
    const user = await requireAuthUser();
    const reviewId = params.content_id;

    const item = await prisma.reviewQueue.findFirst({
      where: {
        id: reviewId,
        userId: user.id,
        completedAt: null,
      },
    });

    if (!item) {
      return fail(ErrorCode.NOT_FOUND, "复习项不存在");
    }

    const now = new Date();
    const nextInterval = Math.min(item.intervalDays * 2, 30);
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + nextInterval);

    const updated = await prisma.reviewQueue.update({
      where: { id: item.id },
      data: { completedAt: now },
    });

    await prisma.reviewQueue.create({
      data: {
        userId: user.id,
        contentType: item.contentType,
        contentId: item.contentId,
        lessonId: item.lessonId,
        dueAt: nextDue,
        intervalDays: nextInterval,
        easeFactor: item.easeFactor + 0.1,
      },
    });

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.REVIEW_DONE,
        payloadJson: { reviewId: item.id, lessonId: item.lessonId },
      },
    });

    return success({ completed: updated, nextReviewAt: nextDue });
  } catch (error) {
    return handleApiError(error);
  }
}
