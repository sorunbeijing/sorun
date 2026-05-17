import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { patchUserExpireSchema } from "@/lib/validators/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const data = patchUserExpireSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        role: true,
      },
    });

    return success(user);
  } catch (error) {
    return handleApiError(error);
  }
}
