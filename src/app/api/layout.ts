/** 所有 API Route 使用 Node.js Runtime（Prisma / bcrypt 不兼容 Edge） */
export const runtime = "nodejs";

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
