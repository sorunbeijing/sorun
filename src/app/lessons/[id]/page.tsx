"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Heart } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageError } from "@/components/layout/page-state";
import { CardFormSkeleton } from "@/components/layout/skeletons";
import { Progress } from "@/components/ui/progress";
import { TEXT_SEP } from "@/lib/format";
import { levelToJapanese } from "@/lib/level-mapping";

interface LessonDetail {
  id: string;
  title: string;
  description?: string;
  level: string;
  durationMinutes?: number;
  content: { steps?: Array<{ type: string; title: string; body?: string }> };
  progress?: { status: string; progressPercent: number } | null;
}

interface ReasonData {
  reasons: Array<{ label: string; detail: string }>;
  score: number;
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [reason, setReason] = useState<ReasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<LessonDetail>(`/api/v1/lessons/${id}`),
      api.get<ReasonData>(`/api/v1/recommendations/${id}/reason`).catch(() => null),
    ])
      .then(([l, r]) => {
        setLesson(l);
        setReason(r);
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStart() {
    setStarting(true);
    try {
      await api.post(`/api/v1/lessons/${id}/start`);
      router.push(`/learn/${id}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "无法开始");
      setStarting(false);
    }
  }

  async function toggleFavorite() {
    try {
      await api.post("/api/v1/favorites", { lessonId: id });
      alert("已收藏");
    } catch {
      alert("收藏失败");
    }
  }

  const showSkeleton = loading && !lesson;

  return (
    <AppShell title="课程详情">
      {showSkeleton && <CardFormSkeleton />}
      {!showSkeleton && error && <PageError message={error} />}
      {!showSkeleton && lesson && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{lesson.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge>{levelToJapanese(lesson.level)}</Badge>
                {lesson.durationMinutes && <Badge variant="outline">{lesson.durationMinutes} 分钟</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson.description && (
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
              )}
              {lesson.progress && lesson.progress.status !== "NOT_STARTED" && (
                <Progress value={lesson.progress.progressPercent} />
              )}
              {reason && reason.reasons.length > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">推荐理由</p>
                  {reason.reasons.map((r, i) => (
                    <p key={i} className="text-muted-foreground">
                      {r.label} {TEXT_SEP} {r.detail}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleStart} disabled={starting}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {lesson.progress?.status === "IN_PROGRESS" ? "继续学习" : "开始学习"}
                </Button>
                <Button variant="outline" size="icon" onClick={toggleFavorite}>
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {lesson.content?.steps && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">课程大纲</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lesson.content.steps.map((step, i) => (
                  <p key={i} className="text-sm">
                    {i + 1}. {step.title}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {lesson.progress?.status === "COMPLETED" && (
            <Button asChild className="w-full">
              <Link href={`/quiz/${id}`}>去做测验</Link>
            </Button>
          )}
        </div>
      )}
    </AppShell>
  );
}
