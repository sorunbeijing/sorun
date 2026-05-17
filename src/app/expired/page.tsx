import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>アカウントの有効期限が切れました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>ご利用期間が終了したため、学習機能をご利用いただけません。</p>
          <p>管理者に連絡して、利用期限の延長を依頼してください。</p>
          <Button asChild className="w-full">
            <Link href="/login">ログイン画面へ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
