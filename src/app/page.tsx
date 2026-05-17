import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/home");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary/10 to-background p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{"\u4e2d\u6587\u5b66\u4e60\u8f6f\u4ef6"}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {"\u5174\u8da3\u5b9a\u5236\u7248 \u00b7 \u4e3a\u4f60\u63a8\u8350\u5408\u9002\u7684\u8bfe\u7a0b"}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/login">{"\u767b\u5f55"}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/register">{"\u6ce8\u518c"}</Link>
        </Button>
      </div>
    </main>
  );
}
