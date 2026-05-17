"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { api, ApiClientError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageError } from "@/components/layout/page-state";
import { levelToJapanese } from "@/lib/level-mapping";
import { CardFormSkeleton } from "@/components/layout/skeletons";

interface MeData {
  email: string;
  name: string | null;
  role: string;
  profile: {
    displayName: string | null;
    level: string;
    totalStudyMinutes: number;
    streakDays: number;
  } | null;
  interests: Array<{ tag: { nameZh: string; icon: string | null } }>;
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MeData>("/api/v1/users/me")
      .then(setMe)
      .catch((e) => setError(e instanceof ApiClientError ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const showSkeleton = loading && !me;

  return (
    <AppShell title="个人中心">
      {showSkeleton && (
        <div className="space-y-4">
          <CardFormSkeleton />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      )}
      {!showSkeleton && error && <PageError message={error} />}
      {!showSkeleton && me && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{me.profile?.displayName ?? me.name ?? "学习者"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>邮箱：{me.email}</p>
              <p>水平：{levelToJapanese(me.profile?.level)}</p>
              <p>累计学习：{me.profile?.totalStudyMinutes ?? 0} 分钟</p>
              <p>连续打卡：{me.profile?.streakDays ?? 0} 天</p>
              <p>
                兴趣：
                {me.interests.map((i) => `${i.tag.icon ?? ""}${i.tag.nameZh}`).join("、") || "未设置"}
              </p>
            </CardContent>
          </Card>
          <Button asChild variant="outline" className="w-full">
            <Link href="/interests/manage" prefetch>管理兴趣</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/statistics" prefetch>学习统计</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/favorites" prefetch>我的收藏</Link>
          </Button>
          {me.role === "ADMIN" && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin" prefetch>后台管理</Link>
            </Button>
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            退出登录
          </Button>
        </div>
      )}
    </AppShell>
  );
}
