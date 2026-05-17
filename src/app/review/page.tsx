"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageEmpty, PageError } from "@/components/layout/page-state";
import { LessonListSkeleton } from "@/components/layout/skeletons";
import { LessonCard, type LessonCardData } from "@/components/lesson/lesson-card";

interface ReviewItem {
  id: string;
  dueAt: string;
  isOverdue: boolean;
  lesson: LessonCardData | null;
}

interface QueueData {
  due: ReviewItem[];
  upcoming: ReviewItem[];
}

export default function ReviewPage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = await api.get<QueueData>("/api/v1/reviews/queue");
      setData(q);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markDone(reviewId: string) {
    setDoneId(reviewId);
    try {
      await api.post(`/api/v1/reviews/${reviewId}/done`);
      await load();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "操作失败");
    } finally {
      setDoneId(null);
    }
  }

  const showSkeleton = loading && !data;

  return (
    <AppShell title="复习">
      {showSkeleton && <LessonListSkeleton count={4} />}
      {!showSkeleton && error && <PageError message={error} onRetry={load} />}
      {!showSkeleton && data && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-medium text-destructive">已到期</h2>
            {data.due.length === 0 ? (
              <PageEmpty title="暂无到期复习" description="继续保持学习节奏" />
            ) : (
              <div className="space-y-3">
                {data.due.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {item.lesson?.title ?? "复习项"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {item.lesson && <LessonCard lesson={item.lesson} href={`/lessons/${item.lesson.id}`} />}
                      <Button
                        size="sm"
                        disabled={doneId === item.id}
                        onClick={() => markDone(item.id)}
                      >
                        {doneId === item.id ? "处理中..." : "完成复习"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
          {data.upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">即将到期</h2>
              <div className="space-y-3">
                {data.upcoming.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="py-4">
                      <p className="font-medium">{item.lesson?.title ?? "复习项"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.dueAt).toLocaleDateString("zh-CN")} 到期
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
