"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { PageError, PageLoading } from "@/components/layout/page-state";
import { levelToJapanese } from "@/lib/level-mapping";

interface LessonRow {
  id: string;
  slug: string;
  title: string;
  baseLevel: string;
  durationMinutes: number;
  isActive: boolean;
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<LessonRow[]>("/api/v1/admin/lessons")
      .then(setLessons)
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;
  if (error) return <PageError message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">课程模板</h1>
        <Button asChild>
          <Link href="/admin/lessons/new">新增课程</Link>
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">标题</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">等级</th>
              <th className="px-3 py-2 text-left">时长</th>
              <th className="px-3 py-2 text-left">状态</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="px-3 py-2">{l.title}</td>
                <td className="px-3 py-2">{l.slug}</td>
                <td className="px-3 py-2">{levelToJapanese(l.baseLevel)}</td>
                <td className="px-3 py-2">{l.durationMinutes} 分</td>
                <td className="px-3 py-2">{l.isActive ? "启用" : "停用"}</td>
                <td className="px-3 py-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/lessons/${l.id}/edit`}>编辑</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
