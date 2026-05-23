export const dynamic = "force-dynamic";
import { LessonProgressStatus, LearningEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { progressSchema } from "@/lib/validators/lessons";

export async function POST(
  request: Request,
  { params }: { params: { lesson_id: string } }
) {
  try {
    const user = await requireAuthUser();
    const lessonId = params.lesson_id;
    const body = await request.json();
    const data = progressSchema.parse(body);

    const lesson = await prisma.generatedLesson.findFirst({
      where: { id: lessonId, userId: user.id },
    });

    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "课程不存在");
    }

    const now = new Date();
    const status =
      data.progressPercent >= 100
        ? LessonProgressStatus.COMPLETED
        : LessonProgressStatus.IN_PROGRESS;

    const progress = await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: {
        progressPercent: data.progressPercent,
        currentStep: data.currentStep ?? undefined,
        status,
        lastAccessedAt: now,
        completedAt: data.progressPercent >= 100 ? now : undefined,
      },
      create: {
        userId: user.id,
        lessonId,
        progressPercent: data.progressPercent,
        currentStep: data.currentStep ?? 0,
        status,
        startedAt: now,
        lastAccessedAt: now,
        completedAt: data.progressPercent >= 100 ? now : null,
      },
    });

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.LESSON_PROGRESS,
        payloadJson: { lessonId, progressPercent: data.progressPercent },
      },
    });

    return success(progress);
  } catch (error) {
    return handleApiError(error);
  }
}
