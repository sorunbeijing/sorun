# 生产环境部署指南（Vercel + Supabase）

本文档面向首次部署，假设使用 **Vercel** 托管 Next.js，**Supabase** 托管 PostgreSQL。

| 文档 / 工具 | 说明 |
|-------------|------|
| **[docs/VERCEL-WALKTHROUGH.md](./docs/VERCEL-WALKTHROUGH.md)** | Vercel 网页逐步点击（截图级） |
| **[scripts/deploy.sh](./scripts/deploy.sh)** | 迁移 / Seed / CLI 部署（Git Bash / WSL） |
| **[scripts/deploy.ps1](./scripts/deploy.ps1)** | 同上，Windows PowerShell 版 |
| **[.env.deploy.example](./.env.deploy.example)** | 本地执行迁移用的环境变量模板 |
| **[.env.deploy.template](./.env.deploy.template)** | 可提交 Git；含默认 `NEXTAUTH_URL` |
| **`pnpm deploy:pull-env`** | 从 Vercel Production 同步到 `.env.deploy` |

---

## 1. 环境变量（`.env.example`）

完整模板见项目根目录 [`.env.example`](./.env.example)。

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | 运行时连接：Supabase **6543** Transaction Pooler + `?pgbouncer=true` |
| `DIRECT_URL` | 是 | 迁移/seed：Supabase **5432** 直连或 Session Pooler，**不要**加 pgbouncer |
| `NEXTAUTH_URL` | 是 | 生产填 `https://你的域名.vercel.app`（必须 HTTPS） |
| `NEXTAUTH_SECRET` | 是 | ≥32 位随机串；与 `AUTH_SECRET` 可填相同值 |
| `AUTH_SECRET` | 建议 | Auth.js v5 别名，与 `NEXTAUTH_SECRET` 相同 |
| `NODE_ENV` | 否 | Vercel 自动为 `production` |
| OAuth `*_CLIENT_*` | 否 | 当前仅用邮箱密码，可不配 |

### 生成 `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

### Supabase 连接串说明

| 用途 | 端口 | 连接串要点 |
|------|------|------------|
| Vercel 运行时 | **6543** | `DATABASE_URL` + `?pgbouncer=true` |
| 本地 migrate / seed | **5432** | `DIRECT_URL`，无 pgbouncer |

密码含 `!`、`@` 等需 [URL 编码](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)（例如 `!` → `%21`）。

### 区域与延迟

- 数据库在 **ap-south-1（孟买）** 时，建议在 Vercel 将 Function Region 设为 **`bom1`（孟买）**（已在 `vercel.json` 配置）。
- 用户在日本/中国大陆访问：页面由 Vercel 边缘节点加速，但 **数据库往返仍到孟买**，可能有 100–200ms+ 额外延迟。若主要用户在日本，可考虑将 Supabase 迁到东京区域，或接受当前延迟。

---

## 2. `package.json` 脚本说明

```json
{
  "postinstall": "prisma generate",
  "build": "prisma generate && next build",
  "db:deploy": "prisma migrate deploy",
  "db:seed": "tsx prisma/seed.ts"
}
```

- Vercel 构建时会执行 `pnpm install` → `postinstall`（生成 Prisma Client）→ `pnpm build`。
- **不要**在 Vercel 构建命令里自动执行 `db:seed`（会重复写入演示数据）。

---

## 3. Prisma 生产配置

`prisma/schema.prisma` 已配置：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // 6543 pooler
  directUrl = env("DIRECT_URL")     // 5432 直连，仅 migrate 使用
}
```

- **应用查询**：走 `DATABASE_URL`（pgbouncer 连接池）。
- **`prisma migrate deploy` / `db push` / `db seed`**：走 `DIRECT_URL`。

---

## A. 首次部署到 Vercel

### 步骤 1：推送代码到 GitHub

```bash
git add .
git commit -m "chore: prepare production deploy"
git push origin main
```

确保 **不要** 提交 `.env`（已在 `.gitignore`）。

### 步骤 2：在 Vercel 创建项目

1. 打开 [https://vercel.com](https://vercel.com) 并登录。
2. **Add New… → Project**。
3. **Import** 你的 GitHub 仓库。
4. Framework Preset：**Next.js**（自动检测）。
5. Build Command：`pnpm run build`（或默认）。
6. Install Command：`pnpm install`。
7. Root Directory：留空（仓库根目录）。

### 步骤 3：配置 Environment Variables

在 **Settings → Environment Variables**，为 **Production**（建议 Preview 也配一份）添加：

| Name | Value |
|------|--------|
| `DATABASE_URL` | Supabase 6543 pooler 连接串 + `?pgbouncer=true` |
| `DIRECT_URL` | Supabase 5432 直连连接串 |
| `NEXTAUTH_URL` | 先填 `https://临时项目名.vercel.app`（部署后可改） |
| `NEXTAUTH_SECRET` | 随机 32+ 字符 |
| `AUTH_SECRET` | 与 `NEXTAUTH_SECRET` 相同 |

### 步骤 4：首次 Deploy

点击 **Deploy**，等待构建完成。

### 步骤 5：更新 `NEXTAUTH_URL`

1. 复制 Vercel 分配的域名，例如 `https://chinese-learning-xxx.vercel.app`。
2. 回到 **Environment Variables**，将 `NEXTAUTH_URL` 改为该 **完整 HTTPS 地址**（无末尾斜杠）。
3. **Redeploy** 一次（Deployments → 最新 → Redeploy），使 Auth 生效。

---

## B. 数据库迁移（关键）

在 **本地**（推荐）对已配置生产库执行，不要依赖 Vercel 构建时迁移。

### 首次部署后（必做）

**推荐：先从 Vercel 拉取变量，再迁移**

```bash
npm i -g vercel && vercel login && vercel link
pnpm deploy:pull-env          # 生成 .env.deploy
./scripts/deploy.sh --migrate --seed
```

```powershell
npm i -g vercel; vercel login; vercel link
pnpm deploy:pull-env
.\scripts\deploy.ps1 -Migrate -Seed
```

若尚未在 Vercel 配置数据库变量，可先 `Copy-Item .env.deploy.template .env.deploy` 再手填 Supabase 连接串。

**或手动：**

```bash
# PowerShell 示例
$env:DATABASE_URL="postgresql://...6543...?pgbouncer=true"
$env:DIRECT_URL="postgresql://...5432..."
pnpm db:deploy
pnpm db:seed
```

**或 Vercel CLI 拉取变量：**

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.vercel --environment=production
# 将内容复制到 .env.deploy 后执行 ./scripts/deploy.sh --migrate --seed
```

### 何时再执行

| 命令 | 时机 |
|------|------|
| `pnpm db:deploy` | 每次 `prisma/migrations` 有新迁移并合并到 main 后 |
| `pnpm db:seed` | 仅首次或需要重置演示数据时（会 upsert，一般可重复执行） |
| `pnpm db:push` | 仅开发环境；生产建议用 migrate，不用 push |

### Supabase 网络

- Supabase Dashboard → **Project Settings → Database**：确认允许外网连接。
- 若启用 IP 限制，需加入你本地 IP 或允许 `0.0.0.0/0`（仅迁移时）。

---

## C. Auth.js 生产配置检查

- [ ] `NEXTAUTH_URL` = 生产 HTTPS 域名（与浏览器地址栏一致）
- [ ] `NEXTAUTH_SECRET` 已设置且足够长
- [ ] 修改 `NEXTAUTH_URL` 后已 **Redeploy**
- [ ] 登录后 session 正常（Credentials 登录）

---

## D. 自定义域名（可选）

1. Vercel → Project → **Settings → Domains** → 添加 `chinese-learn.jp`（示例）。
2. 按提示在 DNS 添加 `CNAME` 或 `A` 记录。
3. 将 `NEXTAUTH_URL` 改为 `https://chinese-learn.jp`。
4. **Redeploy**。

---

## 4. Edge / Runtime 说明

- 所有 `/api/*` Route Handler 已通过 `src/app/api/layout.ts` 声明 **`runtime = "nodejs"`**（Prisma 必须）。
- `middleware.ts` 运行在 Edge，仅做 JWT 校验，**不连接数据库**，可正常使用。

---

## 5. 部署前检查清单

复制到记事本逐项打勾：

- [ ] GitHub 仓库已推送最新代码（含 `prisma/migrations`）
- [ ] `.env` 未提交到 Git
- [ ] Supabase 项目已创建，数据库可连接
- [ ] Supabase 未错误限制外网 IP（或已加白名单）
- [ ] Vercel 已配置 `DATABASE_URL`（6543 + pgbouncer）
- [ ] Vercel 已配置 `DIRECT_URL`（5432 直连）
- [ ] Vercel 已配置 `NEXTAUTH_SECRET` / `AUTH_SECRET`
- [ ] `NEXTAUTH_URL` 为生产 HTTPS 域名且已 Redeploy
- [ ] 本地已执行 `pnpm db:deploy`
- [ ] 本地已执行 `pnpm db:seed`（首次）
- [ ] 生产站可打开首页 / 登录页
- [ ] 演示账号 `demo@example.com` / `demo123456` 可登录
- [ ] 推荐页、学习页、测验页正常
- [ ] 管理员 `admin@example.com` 可进 `/admin`
- [ ] 若曾泄露数据库密码，已在 Supabase **重置密码** 并更新 Vercel 环境变量

---

## 6. 常见问题

### 构建失败：`Prisma Client did not initialize`

- 确认 `postinstall` 含 `prisma generate`。
- 确认 `prisma` 在 `devDependencies` 且 Vercel 安装时包含 dev 依赖。

### 登录后立刻掉线 / 401

- 检查 `NEXTAUTH_URL` 是否与访问域名完全一致（协议 + 域名，无尾斜杠）。

### `prepared statement already exists`（pgbouncer）

- 确认运行时 `DATABASE_URL` 使用 **6543** 且带 `?pgbouncer=true`。
- migrate 使用 `DIRECT_URL`（5432），不要用 pooler。

### 迁移失败

- 使用 `DIRECT_URL` 执行 `pnpm db:deploy`，不要用 6543 连接串做 migrate。

---

## 7. 安全提醒

- **切勿**将含真实密码的 `.env` 提交到 Git 或写在公开文档里。
- 若密码曾在聊天/截图中暴露，请立即在 Supabase **Database → Reset password** 并更新 Vercel 环境变量。
