import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppError, ErrorCode } from "@/lib/errors";
import { isAccountExpired } from "@/lib/user-expiry";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function requireAuthUser(options?: { skipExpiryCheck?: boolean }) {
  const user = await getSessionUser();
  if (!user?.id) {
    throw new AppError(ErrorCode.UNAUTHORIZED);
  }

  if (!options?.skipExpiryCheck && user.role !== "ADMIN") {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { expiresAt: true, role: true },
    });
    if (isAccountExpired(dbUser?.expiresAt, dbUser?.role)) {
      throw new AppError(ErrorCode.ACCOUNT_EXPIRED);
    }
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireAuthUser();
  if (user.role !== "ADMIN") {
    throw new AppError(ErrorCode.FORBIDDEN, "\u9700\u8981\u7ba1\u7406\u5458\u6743\u9650");
  }
  return user;
}
