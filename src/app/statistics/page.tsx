"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageError } from "@/components/layout/page-state";

interface Stats {
  profile: { totalStudyMinutes: number; streakDays: number; level: string };
  completedLessons: number;
  reviewsDone: number;
  quizCount: number;
  averageQuizScore: number;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Stats>("/api/v1/statistics/learning")
      .then(setStats)
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const showSkeleton = loading && !stats;

  return (
    <AppShell title="学习统计">
      {showSkeleton && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted/50" />
          ))}
        </div>
      )}
      {!showSkeleton && error && <PageError message={error} />}
      {!showSkeleton && stats && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">学习时长</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.profile.totalStudyMinutes}</p>
              <p className="text-sm text-muted-foreground">分钟</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">完成课程</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.completedLessons}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">测验次数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.quizCount}</p>
              <p className="text-sm text-muted-foreground">平均分 {stats.averageQuizScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">复习完成</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.reviewsDone}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
