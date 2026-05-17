import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { adminLessonSchema } from "@/lib/validators/admin";

export async function GET() {
  try {
    await requireAdminUser();
    const lessons = await prisma.lessonTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        themeVariants: { include: { themeTag: true } },
      },
    });
    return success(lessons);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const data = adminLessonSchema.parse(body);

    const lesson = await prisma.lessonTemplate.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        baseLevel: data.baseLevel,
        durationMinutes: data.durationMinutes,
        difficulty: data.difficulty,
        contentJson: data.contentJson as Prisma.InputJsonValue,
        quizJson: data.quizJson as Prisma.InputJsonValue,
        isActive: data.isActive ?? true,
      },
    });

    return success(lesson);
  } catch (error) {
    return handleApiError(error);
  }
}
