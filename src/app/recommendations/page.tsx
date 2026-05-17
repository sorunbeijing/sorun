"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { LessonCard, type LessonCardData } from "@/components/lesson/lesson-card";
import { PageEmpty, PageError } from "@/components/layout/page-state";
import { LessonListSkeleton } from "@/components/layout/skeletons";

export default function RecommendationsPage() {
  const [lessons, setLessons] = useState<LessonCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (lessons.length === 0) setLoading(true);
    setError(null);
    try {
      if (refresh) {
        await api.post("/api/v1/recommendations/refresh");
      }
      const data = await api.get<{ lessons: LessonCardData[] }>("/api/v1/recommendations/home");
      setLessons(data.lessons);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "加载失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showSkeleton = loading && lessons.length === 0;

  return (
    <AppShell
      title="推荐课程"
      action={
        <Button variant="ghost" size="icon" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      }
    >
      {showSkeleton && <LessonListSkeleton count={5} />}
      {!showSkeleton && error && <PageError message={error} onRetry={() => load()} />}
      {!showSkeleton && !error && (
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <PageEmpty title="暂无推荐" description="请先完成兴趣与水平设置" />
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
