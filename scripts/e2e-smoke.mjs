/**
 * 本地 API 冒烟测试（需先 pnpm dev）
 * 用法: node scripts/e2e-smoke.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const json = await res.json();
  return { status: res.status, json, cookies: res.headers.getSetCookie?.() || [] };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("Smoke test against", BASE);

  const tags = await req("/api/v1/interests/tags");
  assert(tags.json.code === 0, "tags should succeed");
  console.log("OK GET /interests/tags", tags.json.data?.length, "tags");

  const email = `test_${Date.now()}@example.com`;
  const reg = await req("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "test123456", name: "Test" }),
  });
  assert(reg.json.code === 0, `register failed: ${reg.json.message}`);
  console.log("OK POST /auth/register");

  const login = await req("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "test123456" }),
  });
  assert(login.json.code === 0, `login failed: ${login.json.message}`);
  console.log("OK POST /auth/login");

  console.log("\nNote: Full authenticated API tests require browser session cookies.");
  console.log("Complete the UI flow: login -> interests -> home -> lesson -> quiz -> review");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
