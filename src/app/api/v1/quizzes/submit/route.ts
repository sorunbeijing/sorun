import { LearningEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { quizSubmitSchema } from "@/lib/validators/lessons";
import { scheduleLessonReview } from "@/lib/services/review";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
};

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = await request.json();
    const data = quizSubmitSchema.parse(body);

    const lesson = await prisma.generatedLesson.findFirst({
      where: { id: data.lessonId, userId: user.id },
    });

    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "课程不存在");
    }

    const quiz = lesson.quizJson as { questions?: QuizQuestion[] };
    const questions = quiz.questions ?? [];

    let correct = 0;
    for (const q of questions) {
      if (data.answers[q.id] === q.answer) {
        correct += 1;
      }
    }

    const total = questions.length || 1;
    const score = Math.round((correct / total) * 100);
    const passed = score >= 60;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        lessonId: data.lessonId,
        answersJson: data.answers,
        score,
        passed,
      },
    });

    await scheduleLessonReview(user.id, data.lessonId, passed);

    await prisma.learningEvent.create({
      data: {
        userId: user.id,
        eventType: LearningEventType.QUIZ_SUBMIT,
        payloadJson: { lessonId: data.lessonId, score, passed },
      },
    });

    return success({
      attemptId: attempt.id,
      score,
      passed,
      correct,
      total,
      answers: data.answers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
