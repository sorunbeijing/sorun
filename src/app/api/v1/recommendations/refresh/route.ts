export const dynamic = "force-dynamic";
import { revalidateTag } from "next/cache";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { ensureUserLessons } from "@/lib/services/lesson-generator";
import { getHomeRecommendations } from "@/lib/services/recommendation";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireAuthUser();
    const created = await ensureUserLessons(user.id);
    revalidateTag(`home-${user.id}`);
    const data = await getHomeRecommendations(user.id, { ensureLessons: false });
    return success({ createdCount: created.length, ...data });
  } catch (error) {
    return handleApiError(error);
  }
}
