import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">仪表盘</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">课程模板</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/lessons">管理课程</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">用户与期限</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/users">用户列表</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">兴趣标签</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/interests">标签管理</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
