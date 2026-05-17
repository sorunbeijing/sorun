"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShellSimple } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageEmpty, PageError, PageLoading } from "@/components/layout/page-state";
import { cn } from "@/lib/utils";

interface InterestTag {
  id: string;
  slug: string;
  nameZh: string;
  nameJa: string;
  icon: string | null;
}

export default function OnboardingInterestsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<InterestTag[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [primary, setPrimary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<InterestTag[]>("/api/v1/interests/tags")
      .then(setTags)
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (primary === id) setPrimary(null);
        return prev.filter((x) => x !== id);
      }
      const next = [...prev, id];
      if (!primary) setPrimary(id);
      return next;
    });
  }

  async function handleSave() {
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/v1/users/interests", {
        tagIds: selected,
        primaryTagId: primary ?? selected[0],
      });
      router.push("/onboarding/level");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppShellSimple title="选择兴趣"><PageLoading /></AppShellSimple>;
  if (error && tags.length === 0) {
    return (
      <AppShellSimple title="选择兴趣">
        <PageError message={error} onRetry={() => window.location.reload()} />
      </AppShellSimple>
    );
  }

  return (
    <AppShellSimple title="选择兴趣">
      <Card>
        <CardHeader>
          <CardTitle>你对什么感兴趣？</CardTitle>
          <CardDescription>选择至少 1 个，点击两次可设为主兴趣</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tags.length === 0 ? (
            <PageEmpty title="暂无兴趣标签" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tags.map((tag) => {
                const active = selected.includes(tag.id);
                const isPrimary = primary === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag.id)}
                    onDoubleClick={() => setPrimary(tag.id)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : "hover:bg-muted"
                    )}
                  >
                    <span className="text-2xl">{tag.icon ?? "📚"}</span>
                    <p className="mt-2 font-medium">{tag.nameZh}</p>
                    <p className="text-xs text-muted-foreground">{tag.nameJa}</p>
                    {isPrimary && <p className="mt-1 text-xs text-primary">主兴趣</p>}
                  </button>
                );
              })}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={selected.length === 0 || saving} onClick={handleSave}>
            {saving ? "保存中..." : "下一步：水平测试"}
          </Button>
        </CardContent>
      </Card>
    </AppShellSimple>
  );
}
