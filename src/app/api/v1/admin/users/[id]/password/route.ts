export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { AppError, ErrorCode } from "@/lib/errors";
import { patchUserPasswordSchema } from "@/lib/validators/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const data = patchUserPasswordSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, "用户不存在");
    }

    const passwordHash = await bcrypt.hash(data.new_password, 10);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return success({ ...user, message: "密码已重置" });
  } catch (error) {
    return handleApiError(error);
  }
}
