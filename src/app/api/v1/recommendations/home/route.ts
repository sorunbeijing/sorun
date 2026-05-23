export const dynamic = "force-dynamic";
import { requireAuthUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api-response";
import { getCachedHomeRecommendations } from "@/lib/cache/home";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const data = await getCachedHomeRecommendations(user.id);
    return success(data);
  } catch (error) {
    return handleApiError(error);
  }
}
