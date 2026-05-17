"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShellSimple } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { levelToJapanese } from "@/lib/level-mapping";

const levels = [
  { value: "BEGINNER", label: levelToJapanese("BEGINNER"), desc: "ほとんど中国語ができない" },
  { value: "ELEMENTARY", label: levelToJapanese("ELEMENTARY"), desc: "簡単なあいさつができる" },
  { value: "INTERMEDIATE", label: levelToJapanese("INTERMEDIATE"), desc: "日常会話ができる" },
  { value: "UPPER_INTERMEDIATE", label: levelToJapanese("UPPER_INTERMEDIATE"), desc: "多くの話題について話せる" },
  { value: "ADVANCED", label: levelToJapanese("ADVANCED"), desc: "ほぼ流暢に話せる" },
] as const;

export default function LevelTestPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("BEGINNER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      await api.patch("/api/v1/users/profile", { level: selected });
      await api.post("/api/v1/recommendations/refresh");
      router.push("/home");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShellSimple title="水平测试">
      <Card>
        <CardHeader>
          <CardTitle>你的中文水平？</CardTitle>
          <CardDescription>我们将据此推荐合适难度的课程</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {levels.map((lv) => (
              <button
                key={lv.value}
                type="button"
                onClick={() => setSelected(lv.value)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left",
                  selected === lv.value ? "border-primary bg-primary/5" : "hover:bg-muted"
                )}
              >
                <p className="font-medium">{lv.label}</p>
                <p className="text-sm text-muted-foreground">{lv.desc}</p>
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={saving} onClick={handleSubmit}>
            {saving ? "保存中..." : "进入首页"}
          </Button>
        </CardContent>
      </Card>
    </AppShellSimple>
  );
}
