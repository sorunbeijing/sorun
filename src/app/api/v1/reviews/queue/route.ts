import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { formatLesson } from "@/lib/services/lesson-generator";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const now = new Date();

    const items = await prisma.reviewQueue.findMany({
      where: {
        userId: user.id,
        completedAt: null,
      },
      include: {
        lesson: {
          include: {
            template: true,
            progress: { where: { userId: user.id } },
          },
        },
      },
      orderBy: { dueAt: "asc" },
    });

    const due = items.filter((i) => i.dueAt <= now);
    const upcoming = items.filter((i) => i.dueAt > now);

    return success({
      due: due.map((i) => ({
        id: i.id,
        contentType: i.contentType,
        contentId: i.contentId,
        lessonId: i.lessonId,
        dueAt: i.dueAt,
        isOverdue: true,
        lesson: i.lesson ? formatLesson({ ...i.lesson, progress: i.lesson.progress }) : null,
      })),
      upcoming: upcoming.map((i) => ({
        id: i.id,
        contentType: i.contentType,
        contentId: i.contentId,
        lessonId: i.lessonId,
        dueAt: i.dueAt,
        isOverdue: false,
        lesson: i.lesson ? formatLesson({ ...i.lesson, progress: i.lesson.progress }) : null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
