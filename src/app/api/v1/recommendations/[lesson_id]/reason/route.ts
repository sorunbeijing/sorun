import { requireAuthUser } from "@/lib/auth";
import { success, fail, handleApiError } from "@/lib/api-response";
import { ErrorCode } from "@/lib/errors";
import { getLessonRecommendationReason } from "@/lib/services/recommendation";

export async function GET(
  _request: Request,
  { params }: { params: { lesson_id: string } }
) {
  try {
    const user = await requireAuthUser();
    const reason = await getLessonRecommendationReason(user.id, params.lesson_id);

    if (!reason) {
      return fail(ErrorCode.NOT_FOUND, "课程不存在");
    }

    return success(reason);
  } catch (error) {
    return handleApiError(error);
  }
}
