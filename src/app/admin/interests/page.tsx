"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageError, PageLoading } from "@/components/layout/page-state";

interface Tag {
  id: string;
  slug: string;
  nameZh: string;
  nameJa: string;
  category: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminInterestsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    nameZh: "",
    nameJa: "",
    category: "lifestyle",
    icon: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Tag[]>("/api/v1/admin/interests");
      setTags(data);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/v1/admin/interests", {
        ...form,
        icon: form.icon || null,
      });
      setForm({ slug: "", nameZh: "", nameJa: "", category: "lifestyle", icon: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  async function updateTag(tag: Tag, patch: Partial<Tag>) {
    try {
      await api.patch(`/api/v1/admin/interests/${tag.id}`, patch);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "更新失败");
    }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">兴趣标签</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <form onSubmit={createTag} className="space-y-3 rounded-lg border p-4">
        <p className="font-medium">新增标签</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
          <Input
            placeholder="中文名"
            value={form.nameZh}
            onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
            required
          />
          <Input
            placeholder="日文名"
            value={form.nameJa}
            onChange={(e) => setForm({ ...form, nameJa: e.target.value })}
            required
          />
          <Input
            placeholder="分类"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            placeholder="图标 emoji"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "创建中..." : "创建标签"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">图标</th>
              <th className="px-3 py-2 text-left">中文</th>
              <th className="px-3 py-2 text-left">日文</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">状态</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="px-3 py-2">{t.icon}</td>
                <td className="px-3 py-2">{t.nameZh}</td>
                <td className="px-3 py-2">{t.nameJa}</td>
                <td className="px-3 py-2">{t.slug}</td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTag(t, { isActive: !t.isActive })}
                  >
                    {t.isActive ? "停用" : "启用"}
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
