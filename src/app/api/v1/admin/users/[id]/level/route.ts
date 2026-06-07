export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { AppError, ErrorCode } from "@/lib/errors";
import { patchUserLevelSchema } from "@/lib/validators/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const data = patchUserLevelSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      include: { profile: true },
    });
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "用户不存在");
    }

    if (existing.profile) {
      await prisma.userProfile.update({
        where: { userId: params.id },
        data: { level: data.level },
      });
    } else {
      await prisma.userProfile.create({
        data: {
          userId: params.id,
          level: data.level,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { level: true, displayName: true } },
      },
    });

    return success(user);
  } catch (error) {
    return handleApiError(error);
  }
}
