"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageError, PageLoading } from "@/components/layout/page-state";
import { levelToJapanese } from "@/lib/level-mapping";
import { isAccountExpired } from "@/lib/user-expiry";
import { cn } from "@/lib/utils";

const LEVELS = [
  "BEGINNER",
  "ELEMENTARY",
  "INTERMEDIATE",
  "UPPER_INTERMEDIATE",
  "ADVANCED",
] as const;

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  role: string;
  level: string;
  expiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

const thClass =
  "whitespace-nowrap px-2 py-2 text-left font-medium text-muted-foreground";
const tdClass = "whitespace-nowrap px-2 py-2 text-left align-middle overflow-hidden";
const thActionClass = `${thClass} pr-4`;
const tdActionClass = `${tdClass} pr-4`;

const LEVEL_BADGE_CLASSES: Record<
  (typeof LEVELS)[number],
  { normal: string; expired: string }
> = {
  BEGINNER: {
    normal: "border-emerald-200 bg-emerald-50 text-emerald-800",
    expired: "border-emerald-400/50 bg-emerald-800/80 text-emerald-50",
  },
  ELEMENTARY: {
    normal: "border-sky-200 bg-sky-50 text-sky-800",
    expired: "border-sky-400/50 bg-sky-800/80 text-sky-50",
  },
  INTERMEDIATE: {
    normal: "border-amber-200 bg-amber-50 text-amber-800",
    expired: "border-amber-400/50 bg-amber-800/80 text-amber-50",
  },
  UPPER_INTERMEDIATE: {
    normal: "border-orange-200 bg-orange-50 text-orange-800",
    expired: "border-orange-400/50 bg-orange-800/80 text-orange-50",
  },
  ADVANCED: {
    normal: "border-rose-200 bg-rose-50 text-rose-800",
    expired: "border-rose-400/50 bg-rose-800/80 text-rose-50",
  },
};

function levelBadgeClassName(level: string, expired: boolean): string {
  const key = LEVELS.includes(level as (typeof LEVELS)[number])
    ? (level as (typeof LEVELS)[number])
    : "BEGINNER";
  return expired ? LEVEL_BADGE_CLASSES[key].expired : LEVEL_BADGE_CLASSES[key].normal;
}

function matchesSearch(user: AdminUser, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const displayName = (user.displayName ?? user.name ?? "").toLowerCase();
  const email = user.email.toLowerCase();
  const levelJa = levelToJapanese(user.level).toLowerCase();
  const levelEn = user.level.toLowerCase();
  return (
    displayName.includes(q) ||
    email.includes(q) ||
    levelJa.includes(q) ||
    levelEn.includes(q)
  );
}

function toDatetimeLocalValue(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

function expiryInputChanged(original: string | null, inputValue: string) {
  return inputValue !== toDatetimeLocalValue(original);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [editLevel, setEditLevel] = useState<string>("BEGINNER");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogSaving, setDialogSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const levelChanged = activeUser ? editLevel !== activeUser.level : false;
  const expiryChanged =
    activeUser?.role !== "ADMIN" &&
    expiryInputChanged(activeUser?.expiresAt ?? null, editExpiresAt);
  const passwordTouched = newPassword.length > 0 || confirmPassword.length > 0;
  const hasChanges = levelChanged || expiryChanged || passwordTouched;

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

  function openEdit(user: AdminUser) {
    setActiveUser(user);
    setEditLevel(user.level);
    setEditExpiresAt(toDatetimeLocalValue(user.expiresAt));
    setNewPassword("");
    setConfirmPassword("");
    setDialogError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setActiveUser(null);
    setDialogError(null);
    setNewPassword("");
    setConfirmPassword("");
  }

  async function saveEdit() {
    if (!activeUser) return;

    if (!hasChanges) {
      setSuccess("没有需要保存的变更");
      closeDialog();
      return;
    }

    setDialogSaving(true);
    setDialogError(null);
    setSuccess(null);

    try {
      const tasks: Promise<unknown>[] = [];

      if (levelChanged) {
        tasks.push(
          api.patch(`/api/v1/admin/users/${activeUser.id}/level`, { level: editLevel })
        );
      }

      if (expiryChanged) {
        const expiresAt = editExpiresAt ? new Date(editExpiresAt).toISOString() : null;
        tasks.push(
          api.patch(`/api/v1/admin/users/${activeUser.id}/expire`, { expiresAt })
        );
      }

      if (passwordTouched) {
        if (!newPassword) {
          setDialogError("请先输入新密码");
          return;
        }
        if (newPassword.length < 6) {
          setDialogError("密码至少 6 位");
          return;
        }
        if (newPassword !== confirmPassword) {
          setDialogError("两次输入的密码不一致");
          return;
        }
        tasks.push(
          api.patch(`/api/v1/admin/users/${activeUser.id}/password`, {
            new_password: newPassword,
            confirm_password: confirmPassword,
          })
        );
      }

      await Promise.all(tasks);

      const parts: string[] = [];
      if (levelChanged) parts.push("等级");
      if (expiryChanged) parts.push("过期时间");
      if (passwordTouched && newPassword) parts.push("密码");
      setSuccess(parts.length ? `已更新：${parts.join("、")}` : "用户信息已更新");
      closeDialog();
      await load();
    } catch (e) {
      setDialogError(e instanceof ApiClientError ? e.message : "保存失败");
    } finally {
      setDialogSaving(false);
    }
  }

  const userCount = useMemo(() => users.length, [users.length]);
  const filteredUsers = useMemo(
    () => users.filter((u) => matchesSearch(u, searchQuery)),
    [users, searchQuery]
  );
  const filteredCount = filteredUsers.length;

  if (loading) return <PageLoading />;
  if (error && users.length === 0) return <PageError message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">用户管理</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          共 {userCount} 位用户
          {searchQuery.trim() ? ` · 显示 ${filteredCount} 位` : ""}
        </p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索用户名、邮箱、水平等级"
          className="h-8 max-w-sm flex-1 text-xs sm:flex-none sm:w-72"
        />
        {searchQuery.trim() && (
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setSearchQuery("")}>
            清空
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="max-h-[calc(100vh-11.5rem)] overflow-y-auto">
        <table className="w-full table-fixed text-xs border-collapse">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[24%]" />
            <col className="w-[8%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b bg-muted/95 backdrop-blur-sm">
            <tr>
              <th className={thClass}>用户名</th>
              <th className={thClass}>邮箱</th>
              <th className={thClass}>角色</th>
              <th className={thClass}>水平等级</th>
              <th className={thClass}>最后登录</th>
              <th className={thClass}>注册日期</th>
              <th className={thClass}>过期日期</th>
              <th className={thActionClass}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-8 text-center text-muted-foreground">
                  未找到匹配用户
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
              const displayName = u.displayName ?? u.name ?? "—";
              const expired = isAccountExpired(u.expiresAt, u.role);
              return (
              <tr
                key={u.id}
                className={
                  expired
                    ? "border-b last:border-0 bg-zinc-600 text-zinc-100 transition-colors hover:bg-zinc-500"
                    : "border-b last:border-0 transition-colors hover:bg-muted/30"
                }
              >
                <td className={tdClass}>
                  <span className="block truncate" title={displayName}>
                    {displayName}
                  </span>
                </td>
                <td className={tdClass}>
                  <span className="block truncate" title={u.email}>
                    {u.email}
                  </span>
                </td>
                <td className={tdClass}>
                  <Badge
                    variant={u.role === "ADMIN" ? "default" : "secondary"}
                    className={
                      expired
                        ? "border-zinc-400 bg-zinc-500 px-1.5 py-0 text-[10px] font-normal leading-5 text-zinc-100"
                        : "px-1.5 py-0 text-[10px] font-normal leading-5"
                    }
                  >
                    {u.role === "ADMIN" ? "管理" : "用户"}
                  </Badge>
                </td>
                <td className={tdClass}>
                  <Badge
                    variant="outline"
                    className={cn(
                      "max-w-full truncate px-1.5 py-0 text-[10px] font-normal leading-5",
                      levelBadgeClassName(u.level, expired)
                    )}
                    title={levelToJapanese(u.level)}
                  >
                    {levelToJapanese(u.level)}
                  </Badge>
                </td>
                <td className={`${tdClass} tabular-nums`}>
                  <span className="block truncate" title={formatDateTime(u.lastLoginAt)}>
                    {formatDateOnly(u.lastLoginAt)}
                  </span>
                </td>
                <td className={`${tdClass} tabular-nums`}>
                  {formatDateOnly(u.createdAt)}
                </td>
                <td className={`${tdClass} tabular-nums`}>
                  {u.role === "ADMIN" ? "永久" : formatDateOnly(u.expiresAt)}
                </td>
                <td className={tdActionClass}>
                  <Button
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={() => openEdit(u)}
                  >
                    编辑
                  </Button>
                </td>
              </tr>
            );
            })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {dialogOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background shadow-lg">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">编辑用户</h2>
              <p className="text-sm text-muted-foreground mt-1">可单独或组合修改等级、过期时间与密码</p>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              <section className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  基本信息
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 text-sm rounded-lg bg-muted/30 p-4">
                  <div>
                    <span className="text-muted-foreground">用户名</span>
                    <p className="font-medium mt-0.5">
                      {activeUser.displayName ?? activeUser.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">邮箱</span>
                    <p className="font-medium mt-0.5 break-all">{activeUser.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">角色</span>
                    <p className="font-medium mt-0.5">
                      {activeUser.role === "ADMIN" ? "管理员" : "用户"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">最后登录</span>
                    <p className="font-medium mt-0.5">{formatDateTime(activeUser.lastLoginAt)}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  账户设置
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-level">水平等级</Label>
                  <select
                    id="edit-level"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                  >
                    {LEVELS.map((lv) => (
                      <option key={lv} value={lv}>
                        {levelToJapanese(lv)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-expires">过期时间</Label>
                  {activeUser.role === "ADMIN" ? (
                    <p className="text-sm text-muted-foreground py-2">管理员账户无过期限制</p>
                  ) : (
                    <Input
                      id="edit-expires"
                      type="datetime-local"
                      value={editExpiresAt}
                      onChange={(e) => setEditExpiresAt(e.target.value)}
                    />
                  )}
                </div>
              </section>

              <section className="space-y-4 rounded-lg border border-dashed p-4">
                <div>
                  <h3 className="text-sm font-medium">重置密码</h3>
                  <p className="text-xs text-muted-foreground mt-1">留空则不修改密码</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="不修改请留空"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="不修改请留空"
                  />
                </div>
              </section>

              {dialogError && <p className="text-sm text-destructive">{dialogError}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={closeDialog} disabled={dialogSaving}>
                取消
              </Button>
              <Button onClick={saveEdit} disabled={dialogSaving || !hasChanges}>
                {dialogSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
