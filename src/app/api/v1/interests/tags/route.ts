export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { success, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const tags = await prisma.interestTag.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return success(tags);
  } catch (error) {
    return handleApiError(error);
  }
}
