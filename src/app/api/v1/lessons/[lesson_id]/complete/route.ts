import { LessonProgressStatus, LearningEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { scheduleLessonReview } from "@/lib/services/review";

export async function POST(
  _request: Request,
  { params }: { params: { lesson_id: string } }
) {
  try {
    const user = await requireAuthUser();
    const lessonId = params.lesson_id;

    const lesson = await prisma.generatedLesson.findFirst({
      where: { id: lessonId, userId: user.id },
      include: { template: true },
    });

    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "课程不存在");
    }

    const now = new Date();
    const progress = await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: {
        status: LessonProgressStatus.COMPLETED,
        progressPercent: 100,
        completedAt: now,
        lastAccessedAt: now,
      },
      create: {
        userId: user.id,
        lessonId,
        status: LessonProgressStatus.COMPLETED,
        progressPercent: 100,
        startedAt: now,
        completedAt: now,
        lastAccessedAt: now,
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        totalStudyMinutes: {
          increment: lesson.template.durationMinutes,
        },
        lastStudyDate: now,
      },
      create: {
        userId: user.id,
        totalStudyMinutes: lesson.template.durationMinutes,
        lastStudyDate: now,
      },
    });

    await scheduleLessonReview(user.id, lessonId, true);

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.LESSON_COMPLETE,
        payloadJson: { lessonId },
      },
    });

    return success({ progress, nextStep: "quiz" });
  } catch (error) {
    return handleApiError(error);
  }
}
