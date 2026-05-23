export const dynamic = "force-dynamic";
import { LessonProgressStatus, LearningEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: { lesson_id: string } }
) {
  try {
    const user = await requireAuthUser();
    const lessonId = params.lesson_id;

    const lesson = await prisma.generatedLesson.findFirst({
      where: { id: lessonId, userId: user.id },
    });

    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "课程不存在");
    }

    const now = new Date();
    const progress = await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: {
        status: LessonProgressStatus.IN_PROGRESS,
        startedAt: now,
        lastAccessedAt: now,
      },
      create: {
        userId: user.id,
        lessonId,
        status: LessonProgressStatus.IN_PROGRESS,
        startedAt: now,
        lastAccessedAt: now,
        progressPercent: 0,
        currentStep: 0,
      },
    });

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.LESSON_START,
        payloadJson: { lessonId },
      },
    });

    return success(progress);
  } catch (error) {
    return handleApiError(error);
  }
}
