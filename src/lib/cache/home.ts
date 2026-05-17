import { unstable_cache } from "next/cache";
import { getHomeRecommendations } from "@/lib/services/recommendation";

/** 首页推荐缓存 60 秒，降低跨区数据库往返 */
export function getCachedHomeRecommendations(userId: string) {
  return unstable_cache(
    async () => getHomeRecommendations(userId, { ensureLessons: false }),
    [`home-rec-${userId}`],
    { revalidate: 60, tags: [`home-${userId}`] }
  )();
}
