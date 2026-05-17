"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageError } from "@/components/layout/page-state";
import { CardFormSkeleton } from "@/components/layout/skeletons";
import { Progress } from "@/components/ui/progress";

interface Step {
  type: string;
  title: string;
  body?: string;
  items?: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  lines?: Array<{ speaker: string; text: string; pinyin: string; meaning?: string }>;
}

interface LessonLearn {
  id: string;
  title: string;
  content: { steps?: Step[] };
  progress?: { currentStep: number; progressPercent: number };
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lesson, setLesson] = useState<LessonLearn | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .post(`/api/v1/lessons/${id}/start`)
      .then(() => api.get<LessonLearn>(`/api/v1/lessons/${id}`))
      .then((l) => {
        setLesson(l);
        setStepIndex(l.progress?.currentStep ?? 0);
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const steps = lesson?.content?.steps ?? [];
  const total = steps.length || 1;
  const current = steps[stepIndex];
  const percent = Math.round(((stepIndex + 1) / total) * 100);

  async function saveProgress(nextStep: number, complete = false) {
    setSaving(true);
    try {
      const p = Math.min(100, Math.round((nextStep / total) * 100));
      if (complete) {
        await api.post(`/api/v1/lessons/${id}/complete`);
        router.push(`/quiz/${id}`);
      } else {
        await api.post(`/api/v1/lessons/${id}/progress`, {
          progressPercent: p,
          currentStep: nextStep,
        });
        setStepIndex(nextStep);
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const showSkeleton = loading && !lesson;

  return (
    <AppShell title="学习">
      {showSkeleton && <CardFormSkeleton />}
      {!showSkeleton && error && <PageError message={error} />}
      {!showSkeleton && lesson && current && (
        <div className="space-y-4">
          <Progress value={percent} />
          <p className="text-sm text-muted-foreground">
            步骤 {stepIndex + 1} / {total}
          </p>
          <Card>
            <CardHeader>
              <CardTitle>{current.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {current.body && <p>{current.body}</p>}
              {current.items?.map((item, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-1">
                  <p className="text-2xl font-bold">{item.hanzi}</p>
                  <p className="text-primary">{item.pinyin}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-xs text-muted-foreground/80">意味：</span>
                    {item.meaning}
                  </p>
                </div>
              ))}
              {current.lines?.map((line, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-1">
                  <p className="text-lg font-bold">
                    <span className="text-sm font-medium text-foreground">{line.speaker}: </span>
                    {line.text}
                  </p>
                  <p className="text-primary">{line.pinyin}</p>
                  {line.meaning && (
                    <p className="text-sm text-muted-foreground">
                      <span className="text-xs text-muted-foreground/80">意味：</span>
                      {line.meaning}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={stepIndex === 0 || saving}
              onClick={() => saveProgress(stepIndex - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {stepIndex < total - 1 ? (
              <Button className="flex-1" disabled={saving} onClick={() => saveProgress(stepIndex + 1)}>
                下一步 <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1" disabled={saving} onClick={() => saveProgress(total, true)}>
                完成并测验
              </Button>
            )}
          </div>
          <Button variant="ghost" asChild>
            <Link href={`/lessons/${id}`}>返回详情</Link>
          </Button>
        </div>
      )}
    </AppShell>
  );
}
