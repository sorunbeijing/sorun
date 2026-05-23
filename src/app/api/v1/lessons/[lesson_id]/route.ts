export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { formatLesson } from "@/lib/services/lesson-generator";

export async function GET(
  _request: Request,
  { params }: { params: { lesson_id: string } }
) {
  try {
    const user = await requireAuthUser();

    const lesson = await prisma.generatedLesson.findFirst({
      where: {
        id: params.lesson_id,
        OR: [{ userId: user.id }, { userId: null }],
      },
      include: {
        template: true,
        progress: { where: { userId: user.id } },
        themeVariant: { include: { themeTag: true } },
      },
    });

    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "课程不存在");
    }

    return success({
      ...formatLesson(lesson),
      content: lesson.contentJson,
      quiz: lesson.quizJson,
      theme: lesson.themeVariant?.themeTag ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
