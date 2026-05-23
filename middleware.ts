import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/login", "/register", "/expired"];

function isExpiredToken(token: { role?: string; expiresAt?: string | null }): boolean {
  if (token.role === "ADMIN") return false;
  if (!token.expiresAt) return false;
  return new Date(token.expiresAt) < new Date();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");
  const isAdminApi = pathname.startsWith("/api/v1/admin/");
  const isAuthApi =
    pathname.startsWith("/api/auth") ||
    pathname === "/api/v1/auth/login" ||
    pathname === "/api/v1/auth/register";

  if (isAuthApi) {
    return NextResponse.next();
  }

  const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (isApi) {
      return NextResponse.json(
        { code: 40100, message: "未登录或登录已过期", data: null },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isExpiredToken(token)) {
    if (isApi && !isAdminApi) {
      return NextResponse.json(
        { code: 40301, message: "账户已过期，请联系管理员延长使用期限", data: null },
        { status: 403 }
      );
    }
    if (!isApi && pathname !== "/expired") {
      return NextResponse.redirect(new URL("/expired", request.nextUrl.origin));
    }
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    if (isApi) {
      return NextResponse.json(
        { code: 40300, message: "无权限访问", data: null },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/home", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};