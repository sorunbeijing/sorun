export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { adminInterestTagSchema } from "@/lib/validators/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const data = adminInterestTagSchema.partial().parse(body);

    const tag = await prisma.interestTag.update({
      where: { id: params.id },
      data,
    });

    return success(tag);
  } catch (error) {
    return handleApiError(error);
  }
}
