"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageError } from "@/components/layout/page-state";
import { CardFormSkeleton } from "@/components/layout/skeletons";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: string[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    api
      .get<{ questions: Question[] }>(`/api/v1/quizzes/${id}`)
      .then((d) => setQuestions(d.questions))
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (questions.some((q) => answers[q.id] === undefined)) {
      setError("请回答所有题目");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ score: number; passed: boolean }>("/api/v1/quizzes/submit", {
        lessonId: id,
        answers,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  const showSkeleton = loading && questions.length === 0 && !result;

  return (
    <AppShell title="课程测验">
      {showSkeleton && <CardFormSkeleton />}
      {!showSkeleton && error && !result && <PageError message={error} />}
      {!showSkeleton && result && (
        <Card>
          <CardHeader>
            <CardTitle>{result.passed ? "测验通过！" : "继续加油"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">得分：{result.score}</p>
            <Button className="w-full" onClick={() => router.push("/review")}>
              查看复习任务
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/home">返回首页</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {!loading && !result && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">{q.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                    className={cn(
                      "w-full rounded-md border p-3 text-left text-sm",
                      answers[q.id] === idx ? "border-primary bg-primary/5" : "hover:bg-muted"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
          <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "提交中..." : "提交测验"}
          </Button>
        </div>
      )}
    </AppShell>
  );
}
