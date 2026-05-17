"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { levelToJapanese } from "@/lib/level-mapping";

const LEVELS = ["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "UPPER_INTERMEDIATE", "ADVANCED"] as const;

const defaultContent = {
  theme: "新课程",
  steps: [
    { type: "intro", title: "课程导入", body: "欢迎学习本课。" },
    {
      type: "vocab",
      title: "核心词汇",
      items: [{ hanzi: "你好", pinyin: "nǐ hǎo", meaning: "こんにちは" }],
    },
    { type: "summary", title: "本课小结", body: "完成学习后请做测验。" },
  ],
};

const defaultQuiz = {
  questions: [
    {
      id: "q1",
      question: "「你好」的意思是？",
      options: ["こんにちは", "ありがとう", "さようなら"],
      answer: 0,
    },
  ],
};

export interface LessonFormValues {
  id?: string;
  slug: string;
  title: string;
  description: string;
  baseLevel: string;
  durationMinutes: number;
  difficulty: number;
  contentJson: unknown;
  quizJson: unknown;
  isActive: boolean;
}

export function LessonForm({ initial }: { initial?: LessonFormValues }) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [baseLevel, setBaseLevel] = useState(initial?.baseLevel ?? "BEGINNER");
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? 15));
  const [difficulty, setDifficulty] = useState(String(initial?.difficulty ?? 1));
  const [contentText, setContentText] = useState(
    JSON.stringify(initial?.contentJson ?? defaultContent, null, 2)
  );
  const [quizText, setQuizText] = useState(
    JSON.stringify(initial?.quizJson ?? defaultQuiz, null, 2)
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        slug,
        title,
        description,
        baseLevel,
        durationMinutes: Number(durationMinutes),
        difficulty: Number(difficulty),
        contentJson: JSON.parse(contentText),
        quizJson: JSON.parse(quizText),
        isActive,
      };
      if (initial?.id) {
        await api.put(`/api/v1/admin/lessons/${initial.id}`, payload);
      } else {
        await api.post("/api/v1/admin/lessons", payload);
      }
      router.push("/admin/lessons");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败，请检查 JSON 格式");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">标题</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">描述</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium">等级</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={baseLevel}
            onChange={(e) => setBaseLevel(e.target.value)}
          >
            {LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {levelToJapanese(lv)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">时长（分钟）</label>
          <Input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">难度</label>
          <Input type="number" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">contentJson（含日文 meaning）</label>
        <textarea
          className="mt-1 min-h-[200px] w-full rounded-md border p-2 font-mono text-xs"
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">quizJson</label>
        <textarea
          className="mt-1 min-h-[120px] w-full rounded-md border p-2 font-mono text-xs"
          value={quizText}
          onChange={(e) => setQuizText(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        启用
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "保存中..." : "保存"}
      </Button>
    </form>
  );
}
