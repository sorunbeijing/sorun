import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { updateProfileSchema } from "@/lib/validators/interests";

export async function GET() {
  try {
    const sessionUser = await requireAuthUser();

    const profile = await prisma.userProfile.findUnique({
      where: { userId: sessionUser.id },
    });

    return success(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireAuthUser();
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const profile = await prisma.userProfile.upsert({
      where: { userId: sessionUser.id },
      update: data,
      create: {
        userId: sessionUser.id,
        ...data,
      },
    });

    return success(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
