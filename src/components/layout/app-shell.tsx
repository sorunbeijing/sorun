"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Home,
  ListTodo,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/layout/user-nav";

const navItems = [
  { href: "/home", label: "首页", icon: Home },
  { href: "/recommendations", label: "推荐", icon: Sparkles },
  { href: "/review", label: "复习", icon: ListTodo },
  { href: "/favorites", label: "收藏", icon: Heart },
  { href: "/profile", label: "我的", icon: User },
];

export function AppShell({
  title,
  children,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div>
            <p className="text-xs text-muted-foreground">中文学习</p>
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <UserNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
        <div className="mx-auto flex max-w-3xl justify-around py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                className={cn(
                  "flex flex-col items-center gap-1 px-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function AppShellSimple({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <UserNav />
      </header>
      <main className="mx-auto max-w-md px-4 py-6">{children}</main>
    </div>
  );
}
