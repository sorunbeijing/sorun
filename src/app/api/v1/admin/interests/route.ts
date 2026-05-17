import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { adminInterestTagSchema } from "@/lib/validators/admin";

export async function GET() {
  try {
    await requireAdminUser();
    const tags = await prisma.interestTag.findMany({ orderBy: { sortOrder: "asc" } });
    return success(tags);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const data = adminInterestTagSchema.parse(body);

    const tag = await prisma.interestTag.create({
      data: {
        slug: data.slug,
        nameZh: data.nameZh,
        nameJa: data.nameJa,
        category: data.category,
        icon: data.icon ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    return success(tag);
  } catch (error) {
    return handleApiError(error);
  }
}
