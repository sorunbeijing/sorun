"use client";

import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageError, PageLoading } from "@/components/layout/page-state";
import { levelToJapanese } from "@/lib/level-mapping";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  role: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<AdminUser[]>("/api/v1/admin/users");
      setUsers(data);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveExpiry(userId: string, value: string) {
    setSavingId(userId);
    try {
      const expiresAt = value ? new Date(value).toISOString() : null;
      await api.patch(`/api/v1/admin/users/${userId}/expire`, { expiresAt });
      await load();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "保存失败");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <PageLoading />;
  if (error && users.length === 0) return <PageError message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">用户管理</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">邮箱</th>
              <th className="px-3 py-2 text-left">昵称</th>
              <th className="px-3 py-2 text-left">角色</th>
              <th className="px-3 py-2 text-left">注册时间</th>
              <th className="px-3 py-2 text-left">过期时间</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.displayName ?? u.name ?? "—"}</td>
                <td className="px-3 py-2">{u.role === "ADMIN" ? "管理员" : "用户"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-3 py-2">
                  {u.role === "ADMIN" ? (
                    "无期限"
                  ) : (
                    <Input
                      type="datetime-local"
                      className="w-[200px]"
                      defaultValue={
                        u.expiresAt
                          ? new Date(u.expiresAt).toISOString().slice(0, 16)
                          : ""
                      }
                      id={`exp-${u.id}`}
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {u.role !== "ADMIN" && (
                    <Button
                      size="sm"
                      disabled={savingId === u.id}
                      onClick={() => {
                        const el = document.getElementById(`exp-${u.id}`) as HTMLInputElement;
                        saveExpiry(u.id, el?.value ?? "");
                      }}
                    >
                      {savingId === u.id ? "保存中..." : "保存期限"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        水平等级显示参考：{levelToJapanese("ELEMENTARY")} 等（仅前台展示用）
      </p>
    </div>
  );
}
