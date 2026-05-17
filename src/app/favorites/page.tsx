"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { LessonCard, type LessonCardData } from "@/components/lesson/lesson-card";
import { PageEmpty, PageError } from "@/components/layout/page-state";
import { LessonListSkeleton } from "@/components/layout/skeletons";

export default function FavoritesPage() {
  const [items, setItems] = useState<Array<{ lesson: LessonCardData }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Array<{ lesson: LessonCardData }>>("/api/v1/favorites")
      .then(setItems)
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const showSkeleton = loading && items.length === 0;

  return (
    <AppShell title="收藏">
      {showSkeleton && <LessonListSkeleton count={4} />}
      {!showSkeleton && error && <PageError message={error} />}
      {!showSkeleton && !error && items.length === 0 && (
        <PageEmpty title="暂无收藏" description="在课程详情页可添加收藏" />
      )}
      {!showSkeleton && items.length > 0 && (
        <div className="space-y-3">
          {items.map((f) => (
            <LessonCard key={f.lesson.id} lesson={f.lesson} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
