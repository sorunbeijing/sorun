import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { adminLessonSchema } from "@/lib/validators/admin";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminUser();
    const lesson = await prisma.lessonTemplate.findUnique({
      where: { id: params.id },
      include: { themeVariants: { include: { themeTag: true } } },
    });
    if (!lesson) {
      return fail(ErrorCode.NOT_FOUND, "课程模板不存在");
    }
    return success(lesson);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const data = adminLessonSchema.parse(body);

    const lesson = await prisma.lessonTemplate.update({
      where: { id: params.id },
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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminUser();
    const existing = await prisma.lessonTemplate.findUnique({ where: { id: params.id } });
    if (!existing) {
      return fail(ErrorCode.NOT_FOUND, "课程模板不存在");
    }
    await prisma.lessonTemplate.delete({ where: { id: params.id } });
    return success({ id: params.id });
  } catch (error) {
    return handleApiError(error);
  }
}
