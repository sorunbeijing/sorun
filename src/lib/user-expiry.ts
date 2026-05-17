/** 注册默认 1 年有效期；管理员账号可不设过期 */

export function addYears(from: Date, years: number): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export function defaultExpiresAt(from: Date = new Date()): Date {
  return addYears(from, 1);
}

export function isAccountExpired(
  expiresAt: Date | string | null | undefined,
  role?: string | null
): boolean {
  if (role === "ADMIN") return false;
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
