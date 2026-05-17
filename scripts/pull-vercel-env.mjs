#!/usr/bin/env node
/**
 * 从 Vercel Production 拉取环境变量，合并写入 .env.deploy
 *
 * 前置：npm i -g vercel && vercel login && vercel link
 * 用法：pnpm deploy:pull-env
 *       node scripts/pull-vercel-env.mjs [--environment production|preview]
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "AUTH_SECRET",
  "NODE_ENV",
];

const PULL_FILE = path.join(ROOT, ".env.vercel.pull");
const OUTPUT = path.join(ROOT, ".env.deploy");
const TEMPLATE = path.join(ROOT, ".env.deploy.template");
const VERCEL_PROJECT = path.join(ROOT, ".vercel", "project.json");

function parseArgs() {
  const args = process.argv.slice(2);
  let environment = "production";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--environment" && args[i + 1]) {
      environment = args[++i];
    }
  }
  return { environment };
}

function parseEnvFile(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function readProjectName() {
  try {
    const json = JSON.parse(fs.readFileSync(VERCEL_PROJECT, "utf8"));
    return json.projectName || null;
  } catch {
    return null;
  }
}

function defaultNextAuthUrl(projectName) {
  const name =
    projectName ||
    process.env.VERCEL_PROJECT_NAME ||
    "chinese-learning-app";
  return `https://${name}.vercel.app`;
}

function ensureVercelCli() {
  try {
    execSync("vercel --version", { stdio: "pipe" });
  } catch {
    console.error(
      "[pull-env] 未找到 vercel CLI。请运行: npm i -g vercel && vercel login"
    );
    process.exit(1);
  }
}

function ensureLinked() {
  if (!fs.existsSync(VERCEL_PROJECT)) {
    console.log("[pull-env] 未检测到 .vercel/project.json，正在运行 vercel link …");
    execSync("vercel link", { cwd: ROOT, stdio: "inherit" });
  }
}

function pullFromVercel(environment) {
  console.log(`[pull-env] 拉取 Vercel 环境变量 (${environment}) …`);
  execSync(
    `vercel env pull "${PULL_FILE}" --environment=${environment} --yes`,
    { cwd: ROOT, stdio: "inherit" }
  );
  if (!fs.existsSync(PULL_FILE)) {
    console.error("[pull-env] 拉取失败：未生成 .env.vercel.pull");
    process.exit(1);
  }
}

function loadTemplateDefaults() {
  if (!fs.existsSync(TEMPLATE)) return new Map();
  return parseEnvFile(fs.readFileSync(TEMPLATE, "utf8"));
}

function writeDeployFile(merged, meta) {
  const lines = [
    "# =============================================================================",
    `# 由 scripts/pull-vercel-env.mjs 生成 — ${new Date().toISOString()}`,
    `# 来源: Vercel ${meta.environment} 环境变量`,
    meta.projectName
      ? `# 项目: ${meta.projectName} → 默认域名 https://${meta.projectName}.vercel.app`
      : "# 项目: （未读取到 projectName）",
    "# 勿提交 Git（已在 .gitignore）",
    "# =============================================================================",
    "",
  ];

  for (const key of KEYS) {
    const value = merged.get(key);
    if (value === undefined) continue;
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`${key}="${escaped}"`);
  }

  if (meta.projectName) {
    lines.push("");
    lines.push(`VERCEL_PROJECT_NAME="${meta.projectName}"`);
  }

  lines.push("");
  fs.writeFileSync(OUTPUT, lines.join("\n"), "utf8");
}

function main() {
  const { environment } = parseArgs();
  ensureVercelCli();
  ensureLinked();

  const projectName = readProjectName();
  pullFromVercel(environment);

  const pulled = parseEnvFile(fs.readFileSync(PULL_FILE, "utf8"));
  const template = loadTemplateDefaults();
  const merged = new Map(template);

  for (const key of KEYS) {
    if (pulled.has(key)) merged.set(key, pulled.get(key));
  }

  if (!merged.get("NEXTAUTH_URL") || merged.get("NEXTAUTH_URL").includes("your-app")) {
    const inferred = defaultNextAuthUrl(projectName);
    console.warn(
      `[pull-env] Vercel 未返回 NEXTAUTH_URL，使用推断值: ${inferred}`
    );
    console.warn(
      "[pull-env] 若登录异常，请到 Vercel → Settings → Domains 复制真实域名后改 .env.deploy"
    );
    merged.set("NEXTAUTH_URL", inferred);
  }

  if (merged.get("AUTH_SECRET") && !merged.get("NEXTAUTH_SECRET")) {
    merged.set("NEXTAUTH_SECRET", merged.get("AUTH_SECRET"));
  }
  if (merged.get("NEXTAUTH_SECRET") && !merged.get("AUTH_SECRET")) {
    merged.set("AUTH_SECRET", merged.get("NEXTAUTH_SECRET"));
  }

  const missing = ["DATABASE_URL", "DIRECT_URL"].filter((k) => !merged.get(k));
  if (missing.length) {
    console.error(
      `[pull-env] 缺少变量: ${missing.join(", ")}。请先在 Vercel Dashboard → Environment Variables 配置后再拉取。`
    );
    process.exit(1);
  }

  writeDeployFile(merged, { environment, projectName });

  console.log("");
  console.log("[pull-env] 已写入:", OUTPUT);
  console.log("[pull-env] NEXTAUTH_URL =", merged.get("NEXTAUTH_URL"));
  console.log("");
  console.log("下一步:");
  console.log("  .\\scripts\\deploy.ps1 -Migrate -Seed     # Windows");
  console.log("  ./scripts/deploy.sh --migrate --seed    # Git Bash");
}

main();
