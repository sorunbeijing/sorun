export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const sessionUser = await requireAuthUser();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        profile: true,
        interests: {
          include: { tag: true },
          orderBy: { weight: "desc" },
        },
      },
    });

    if (!user) {
      return success(null);
    }

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt: user.expiresAt,
      createdAt: user.createdAt,
      profile: user.profile,
      interests: user.interests.map((i) => ({
        tagId: i.tagId,
        isPrimary: i.isPrimary,
        weight: i.weight,
        tag: i.tag,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
