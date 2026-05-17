import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireAdminUser();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        profile: { select: { displayName: true } },
      },
    });

    return success(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        displayName: u.profile?.displayName,
        role: u.role,
        expiresAt: u.expiresAt,
        createdAt: u.createdAt,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
