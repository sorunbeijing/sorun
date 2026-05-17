import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";

/** quiz_id 即 lesson_id */
export async function GET(
  _request: Request,
  { params }: { params: { quiz_id: string } }
) {
  try {
    const user = await requireAuthUser();
    const lessonId = params.quiz_id;

    const lesson = await prisma.generatedLesson.findFirst({
      where: { id: lessonId, userId: user.id },
    });

    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "测验不存在");
    }

    const quiz = lesson.quizJson as {
      questions?: Array<{
        id: string;
        question: string;
        options: string[];
      }>;
    };

    const questions = (quiz.questions ?? []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return success({ lessonId, questions });
  } catch (error) {
    return handleApiError(error);
  }
}
