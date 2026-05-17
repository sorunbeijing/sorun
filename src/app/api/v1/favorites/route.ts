import { LearningEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { z } from "zod";
import { formatLesson } from "@/lib/services/lesson-generator";

const favoriteSchema = z.object({
  lessonId: z.string().min(1),
});

export async function GET() {
  try {
    const user = await requireAuthUser();

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        lesson: {
          include: {
            template: true,
            progress: { where: { userId: user.id } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(
      favorites.map((f) => ({
        id: f.id,
        lessonId: f.lessonId,
        createdAt: f.createdAt,
        lesson: formatLesson({ ...f.lesson, progress: f.lesson.progress }),
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    const { lessonId } = favoriteSchema.parse(body);

    const lesson = await prisma.generatedLesson.findFirst({
      where: { id: lessonId, userId: user.id },
    });

    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "课程不存在");
    }

    const favorite = await prisma.favorite.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: {},
      create: { userId: user.id, lessonId },
    });

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.FAVORITE_ADD,
        payloadJson: { lessonId },
      },
    });

    return success(favorite);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthUser();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("lessonId");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      const parsed = favoriteSchema.safeParse(body);
      if (!parsed.success) {
        return fail(ErrorCode.BAD_REQUEST, "请提侁ElessonId");
      }
      id = parsed.data.lessonId;
    }

    await prisma.favorite.deleteMany({
      where: { userId: user.id, lessonId: id },
    });

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.FAVORITE_REMOVE,
        payloadJson: { lessonId: id },
      },
    });

    return success({ removed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
