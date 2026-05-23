export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { AppError, ErrorCode } from "@/lib/errors";
import { saveInterestsSchema } from "@/lib/validators/interests";

export async function GET() {
  try {
    const sessionUser = await requireAuthUser();

    const interests = await prisma.userInterest.findMany({
      where: { userId: sessionUser.id },
      include: { tag: true },
      orderBy: [{ isPrimary: "desc" }, { weight: "desc" }],
    });

    return success(
      interests.map((i) => ({
        id: i.id,
        tagId: i.tagId,
        isPrimary: i.isPrimary,
        weight: i.weight,
        tag: i.tag,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuthUser();
    const body = await request.json();
    const data = saveInterestsSchema.parse(body);

    const tags = await prisma.interestTag.findMany({
      where: { id: { in: data.tagIds }, isActive: true },
    });

    if (tags.length !== data.tagIds.length) {
      throw new AppError(ErrorCode.VALIDATION, "\u5305\u542b\u65e0\u6548\u7684\u5174\u8da3\u6807\u7b7e");
    }

    const primaryTagId =
      data.primaryTagId && data.tagIds.includes(data.primaryTagId)
        ? data.primaryTagId
        : data.tagIds[0];

    await prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({ where: { userId: sessionUser.id } });

      for (let i = 0; i < data.tagIds.length; i++) {
        const tagId = data.tagIds[i];
        await tx.userInterest.create({
          data: {
            userId: sessionUser.id,
            tagId,
            isPrimary: tagId === primaryTagId,
            weight: tagId === primaryTagId ? 10 : Math.max(1, 10 - i),
          },
        });
      }

      await tx.userProfile.upsert({
        where: { userId: sessionUser.id },
        update: { primaryInterestId: primaryTagId },
        create: {
          userId: sessionUser.id,
          primaryInterestId: primaryTagId,
        },
      });
    });

    const interests = await prisma.userInterest.findMany({
      where: { userId: sessionUser.id },
      include: { tag: true },
    });

    return success(interests);
  } catch (error) {
    return handleApiError(error);
  }
}
