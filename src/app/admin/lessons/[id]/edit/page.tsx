"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { LessonForm, type LessonFormValues } from "@/components/admin/lesson-form";
import { PageError, PageLoading } from "@/components/layout/page-state";

export default function AdminEditLessonPage() {
  const params = useParams();
  const id = params.id as string;
  const [initial, setInitial] = useState<LessonFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<LessonFormValues & { id: string }>(`/api/v1/admin/lessons/${id}`)
      .then((found) => {
        setInitial({
          id: found.id,
          slug: found.slug,
          title: found.title,
          description: found.description,
          baseLevel: found.baseLevel,
          durationMinutes: found.durationMinutes,
          difficulty: found.difficulty,
          contentJson: found.contentJson,
          quizJson: found.quizJson,
          isActive: found.isActive,
        });
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoading />;
  if (error || !initial) return <PageError message={error ?? "课程不存在"} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">编辑课程模板</h1>
      <LessonForm initial={initial} />
    </div>
  );
}
