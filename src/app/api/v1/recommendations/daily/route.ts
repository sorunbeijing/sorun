import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { getHomeRecommendations } from "@/lib/services/recommendation";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const { daily, reviews } = await getHomeRecommendations(user.id);
    return success({ daily, reviews });
  } catch (error) {
    return handleApiError(error);
  }
}
