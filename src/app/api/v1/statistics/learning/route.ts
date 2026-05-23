export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireAuthUser();

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    const completedLessons = await prisma.userLessonProgress.count({
      where: { userId: user.id, status: "COMPLETED" },
    });

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });

    const reviewsDone = await prisma.learningEvent.count({
      where: { userId: user.id, eventType: "REVIEW_DONE" },
    });

    const avgScore =
      quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length
          )
        : 0;

    const recentEvents = await prisma.learningEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return success({
      profile: {
        totalStudyMinutes: profile?.totalStudyMinutes ?? 0,
        streakDays: profile?.streakDays ?? 0,
        level: profile?.level ?? "BEGINNER",
        lastStudyDate: profile?.lastStudyDate,
      },
      completedLessons,
      reviewsDone,
      quizCount: quizAttempts.length,
      averageQuizScore: avgScore,
      recentQuizAttempts: quizAttempts,
      recentEvents,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
