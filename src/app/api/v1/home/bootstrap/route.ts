export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { getCachedHomeRecommendations } from "@/lib/cache/home";

/** 单次请求返回用户信息 + 首页推荐，减少客户端往返 */
export async function GET() {
  try {
    const sessionUser = await requireAuthUser();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        interests: {
          select: { tagId: true, isPrimary: true, tag: { select: { id: true, nameZh: true } } },
        },
      },
    });

    if (!user) {
      return success({ needsOnboarding: true, interests: [], recommendations: null });
    }

    const needsOnboarding = user.interests.length === 0;

    if (needsOnboarding) {
      return success({
        needsOnboarding: true,
        interests: [],
        recommendations: null,
      });
    }

    const recommendations = await getCachedHomeRecommendations(sessionUser.id);

    return success({
      needsOnboarding: false,
      interests: user.interests,
      recommendations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
