"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { LessonCard, type LessonCardData } from "@/components/lesson/lesson-card";
import { PageEmpty, PageError } from "@/components/layout/page-state";
import { HomePageSkeleton } from "@/components/layout/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TEXT_SEP } from "@/lib/format";

interface HomeData {
  reviews: Array<{
    id: string;
    lessonId: string | null;
    reason: { label: string; detail: string };
    lesson: LessonCardData | null;
  }>;
  lessons: LessonCardData[];
  daily: LessonCardData[];
}

interface BootstrapResponse {
  needsOnboarding: boolean;
  recommendations: HomeData | null;
}

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else if (!data) setLoading(true);
      setError(null);
      try {
        if (refresh) {
          await api.post("/api/v1/recommendations/refresh");
        }
        const boot = await api.get<BootstrapResponse>("/api/v1/home/bootstrap");
        if (boot.needsOnboarding) {
          router.replace("/onboarding/interests");
          return;
        }
        setData(boot.recommendations);
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "加载失败");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    load();
  }, [load]);

  const showSkeleton = loading && !data;

  return (
    <AppShell
      title="首页"
      action={
        <Button variant="ghost" size="icon" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      }
    >
      {showSkeleton && <HomePageSkeleton />}
      {!showSkeleton && error && <PageError message={error} onRetry={() => load()} />}
      {!showSkeleton && !error && data && (
        <div className="space-y-6">
          {data.reviews.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">待复习</h2>
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">复习到期</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.reviews.map((r) => (
                    <Link
                      key={r.id}
                      href={r.lessonId ? `/review?highlight=${r.id}` : "/review"}
                      className="block text-sm text-primary hover:underline"
                      prefetch
                    >
                      {r.lesson?.title ?? "复习任务"} {TEXT_SEP} {r.reason.detail}
                    </Link>
                  ))}
                  <Button asChild variant="outline" size="sm">
                    <Link href="/review" prefetch>
                      去复习
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">今日推荐</h2>
              <Link href="/recommendations" className="text-xs text-primary" prefetch>
                查看全部
              </Link>
            </div>
            {data.daily.length === 0 ? (
              <PageEmpty title="暂无推荐" actionLabel="刷新推荐" onAction={() => load(true)} />
            ) : (
              <div className="space-y-3">
                {data.daily.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">为你推荐</h2>
            {data.lessons.length === 0 ? (
              <PageEmpty title="暂无课程" description="请先选择兴趣并刷新" />
            ) : (
              <div className="space-y-3">
                {data.lessons.slice(0, 5).map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
