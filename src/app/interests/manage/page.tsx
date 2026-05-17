"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PageEmpty, PageError, PageLoading } from "@/components/layout/page-state";
import { cn } from "@/lib/utils";

interface InterestTag {
  id: string;
  nameZh: string;
  icon: string | null;
}

export default function ManageInterestsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<InterestTag[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [primary, setPrimary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<InterestTag[]>("/api/v1/interests/tags"),
      api.get<Array<{ tagId: string; isPrimary: boolean }>>("/api/v1/users/interests"),
    ])
      .then(([allTags, userInterests]) => {
        setTags(allTags);
        const ids = userInterests.map((i) => i.tagId);
        setSelected(ids);
        const p = userInterests.find((i) => i.isPrimary);
        setPrimary(p?.tagId ?? ids[0] ?? null);
      })
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
    try {
      await api.post("/api/v1/users/interests", {
        tagIds: selected,
        primaryTagId: primary ?? selected[0],
      });
      await api.post("/api/v1/recommendations/refresh");
      router.push("/home");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="兴趣管理">
      {loading && <PageLoading />}
      {!loading && error && tags.length === 0 && <PageError message={error} />}
      {!loading && tags.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">双击设为主兴趣</p>
          <div className="grid grid-cols-2 gap-3">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                onDoubleClick={() => setPrimary(tag.id)}
                className={cn(
                  "rounded-lg border p-4 text-left",
                  selected.includes(tag.id) ? "border-primary bg-primary/5" : ""
                )}
              >
                <span className="text-2xl">{tag.icon ?? "📚"}</span>
                <p className="mt-1 font-medium">{tag.nameZh}</p>
                {primary === tag.id && <p className="text-xs text-primary">主兴趣</p>}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={saving || selected.length === 0} onClick={handleSave}>
            {saving ? "保存中..." : "保存并刷新推荐"}
          </Button>
        </div>
      )}
      {!loading && tags.length === 0 && !error && <PageEmpty title="暂无标签" />}
    </AppShell>
  );
}
