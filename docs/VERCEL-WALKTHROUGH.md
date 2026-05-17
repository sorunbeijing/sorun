# Vercel 部署手把手教程（截图级说明）

本文档按 **Vercel 网页界面** 逐步操作，每一步写明「点哪里、填什么、成功时长什么样」。  
配套自动化脚本见 [`scripts/deploy.sh`](../scripts/deploy.sh)。

> **前置条件**：代码已在 GitHub；Supabase 项目已创建；本地已安装 Node 20+、pnpm、Git。

---

## 第 0 步：准备 Supabase 连接串（在 Vercel 之前完成）

### 0.1 打开 Supabase

1. 浏览器访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录后点击你的项目（例如 `chinese-learning`）

**此时屏幕**：左侧深色导航栏，中间是 Project Overview。

### 0.2 复制两条数据库 URL

1. 左侧点击 **Project Settings**（齿轮图标，在侧边栏最下方区域）
2. 子菜单点 **Database**
3. 向下滚动到 **Connection string** 区域
4. 顶部 Tab 选 **URI**
5. **Type** 下拉选 **URI**，再选连接方式：

| 用途 | 在 Supabase 界面选 | 端口 | 写入变量 |
|------|-------------------|------|----------|
| Vercel 运行时 | **Transaction pooler** | **6543** | `DATABASE_URL` |
| 迁移 / Seed | **Session pooler** 或 **Direct connection** | **5432** | `DIRECT_URL` |

6. 点击 **Copy** 复制连接串
7. 对 **6543** 那条，在末尾手动加上：`?pgbouncer=true`（若还没有）

**密码含特殊字符**（如 `!`、`@`）必须 URL 编码，否则 Prisma 连不上：

| 字符 | 编码 |
|------|------|
| `!` | `%21` |
| `@` | `%40` |
| `#` | `%23` |

**示例形状**（勿照抄密码）：

```text
DATABASE_URL=postgresql://postgres.xxxx:ENCODED_PASS@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxx:ENCODED_PASS@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

### 0.3 确认数据库允许外网访问

仍在 **Project Settings → Database**：

- 若看到 **Network Restrictions / IP allow list**：迁移时你的电脑 IP 须在列表内，或临时允许 `0.0.0.0/0`（仅在你信任网络时使用）
- 默认新项目通常可直接外网连接

---

## 第 1 步：推送代码到 GitHub

在本地项目根目录（PowerShell 或 Git Bash）：

```bash
git status
git add .
git commit -m "chore: prepare vercel deploy"
git push origin main
```

**成功标志**：GitHub 仓库页面能看到最新 commit，且 **没有** `.env` 文件。

---

## 第 2 步：在 Vercel 导入 GitHub 仓库

### 2.1 进入新建项目页

1. 打开 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 右上角点击 **Add New…**（或 **Add New Project**）
3. 选择 **Project**

**此时屏幕**：标题 “Let’s build something new”，下方是 Git 仓库列表。

### 2.2 连接 GitHub（首次需要）

若列表为空或没有你的仓库：

1. 点击 **Install** / **Adjust GitHub App** / **Connect GitHub Account**
2. 在 GitHub 弹窗中选择 **Only select repositories** 或 **All repositories**
3. 勾选 `chinese-learning-app`（你的仓库名）
4. 点击 **Install** / **Save**

返回 Vercel 后点 **Refresh**，仓库应出现在列表中。

### 2.3 导入仓库

1. 在搜索框输入仓库名
2. 点击仓库右侧 **Import**

**此时屏幕**：**Configure Project** 页面。

### 2.4 配置构建设置（逐项核对）

| 字段 | 应填写的值 | 说明 |
|------|-----------|------|
| **Project Name** | 例如 `chinese-learning` | 会变成 `xxx.vercel.app` 子域名 |
| **Framework Preset** | **Next.js** | 一般自动识别 |
| **Root Directory** | `./`（默认） | 代码在仓库根目录则留空 |
| **Build Command** | `pnpm run build` | 与 `vercel.json` 一致 |
| **Output Directory** | 留空 | Next.js 默认 |
| **Install Command** | `pnpm install` | 必须，项目用 pnpm |

**不要**在这一页点 Deploy——先配环境变量（下一步）。

---

## 第 3 步：配置环境变量（最关键）

### 3.1 展开 Environment Variables

在 **Configure Project** 页面：

1. 找到 **Environment Variables** 折叠区，点击展开
2. 对下面每一行：左侧 **Key**，右侧 **Value**，Environment 勾选 **Production**（建议 **Preview** 也勾）

### 3.2 逐条添加（共 5 条）

| Key | Value 怎么填 | Production | Preview |
|-----|-------------|------------|---------|
| `DATABASE_URL` | Supabase **6543** + `?pgbouncer=true` | ✓ | ✓ |
| `DIRECT_URL` | Supabase **5432**，无 pgbouncer | ✓ | ✓ |
| `NEXTAUTH_SECRET` | 运行 `openssl rand -base64 32` 生成 | ✓ | ✓ |
| `AUTH_SECRET` | **与 NEXTAUTH_SECRET 完全相同** | ✓ | ✓ |
| `NEXTAUTH_URL` | 先填 `https://你的项目名.vercel.app`（与 Project Name 一致） | ✓ | ✓ |

**NEXTAUTH_URL 临时写法**：若 Project Name 是 `chinese-learning`，则填：

```text
https://chinese-learning.vercel.app
```

（不要末尾 `/`；必须 `https://`）

### 3.3 点击 Deploy

页面底部点击 **Deploy**。

**此时屏幕**：跳转到 **Deployment** 详情页，顶部有进度条 **Building…**

### 3.4 等待构建成功

约 2–5 分钟，日志中应看到类似：

```text
Running "pnpm install"
Running "prisma generate"
Running "pnpm run build"
✓ Compiled successfully
```

**成功标志**：

- 顶部绿色 **Ready**
- 出现 **Visit** 按钮
- 域名类似 `https://chinese-learning-xxx.vercel.app`

**若失败**：点开 **Build Logs**，常见原因见 [DEPLOY.md §6 常见问题](../DEPLOY.md#6-常见问题)。

---

## 第 4 步：修正 NEXTAUTH_URL 并重新部署

首次 Deploy 用的 `NEXTAUTH_URL` 可能与最终域名略有差异（Vercel 有时会加随机后缀）。

### 4.1 确认真实生产域名

1. 在项目页顶部点击 **Visit**，或 **Settings → Domains**
2. 复制浏览器地址栏的 origin，例如 `https://chinese-learning-abc123.vercel.app`

### 4.2 更新环境变量

1. 顶部 Tab **Settings**
2. 左侧 **Environment Variables**
3. 找到 `NEXTAUTH_URL` → 右侧 **⋯** → **Edit**
4. 改为上一步复制的 **完整 HTTPS 地址**（无尾斜杠）
5. **Save**

### 4.3 Redeploy

1. 顶部 Tab **Deployments**
2. 最新一条部署右侧 **⋯** → **Redeploy**
3. 勾选 **Use existing Build Cache** 可保留，点击 **Redeploy**

**成功标志**：新部署 **Ready** 后，用该域名打开 `/login` 不应出现 Auth 配置错误。

---

## 第 5 步：从 Vercel 同步环境变量到本地（推荐）

在跑数据库迁移之前，先把 Vercel Dashboard 里已配置的变量同步到本地 `.env.deploy`，避免手抄出错。

### 5.1 安装并登录 Vercel CLI

在 **PowerShell** 或 **Git Bash** 执行：

```bash
npm i -g vercel
vercel login
```

**此时屏幕**：浏览器打开 Vercel 授权页 → 点击 **Confirm** → 终端显示 `Success!`

### 5.2 关联本地目录与 Vercel 项目

在项目根目录 `c:\work`：

```bash
cd c:\work
vercel link
```

按提示选择：

| 提示 | 建议选择 |
|------|----------|
| Set up and deploy? | **N**（只关联，不立即部署） |
| Which scope? | 你的个人或团队账号 |
| Link to existing project? | **Y** |
| Project name? | 你在第 2 步 Import 时起的名字，例如 `chinese-learning-app` |

**成功标志**：项目根目录出现 `.vercel/project.json`（已在 `.gitignore`，不会提交）。

### 5.3 一键拉取并生成 `.env.deploy`

```powershell
# Windows（任选其一）
pnpm deploy:pull-env
# 或
.\scripts\pull-vercel-env.ps1
```

```bash
# Git Bash / macOS
pnpm deploy:pull-env
# 或
./scripts/pull-vercel-env.sh
```

**脚本会做什么：**

1. 执行 `vercel env pull` 从 **Production** 拉取变量到临时文件
2. 合并 `DATABASE_URL`、`DIRECT_URL`、`NEXTAUTH_*` 等到 **`.env.deploy`**
3. 若 Vercel 未返回 `NEXTAUTH_URL`，按项目名推断为  
   `https://chinese-learning-app.vercel.app`（见 [`.env.deploy.template`](../.env.deploy.template)）

**成功标志**：

```text
[pull-env] 已写入: c:\work\.env.deploy
[pull-env] NEXTAUTH_URL = https://chinese-learning-app.vercel.app
```

### 5.4 核对 `NEXTAUTH_URL`（重要）

Vercel 实际域名可能与项目名不完全一致（例如带 `-abc123` 后缀）。

1. 打开 Vercel → 你的项目 → **Settings → Domains**
2. 复制 **Production** 主域名（例如 `https://chinese-learning-app-xyz.vercel.app`）
3. 若与 `.env.deploy` 中不一致：
   - 在 Vercel **Environment Variables** 中把 `NEXTAUTH_URL` 改为该域名并 **Redeploy**
   - 本地再执行一次 `pnpm deploy:pull-env` 同步

### 5.5 若拉取失败：缺少 DATABASE_URL

说明 Vercel 尚未配置数据库变量。回到 **第 3 步** 在 Dashboard 添加后再执行 `pnpm deploy:pull-env`。

也可用手动模板（无密码，可提交 Git）：

```powershell
Copy-Item .env.deploy.template .env.deploy
# 编辑 .env.deploy，只填 Supabase 的 DATABASE_URL / DIRECT_URL
```

---

## 第 6 步：数据库迁移与 Seed（本地执行）

Vercel **不会**自动跑迁移，需在本地对生产库执行一次（使用上一步生成的 `.env.deploy`）。

### 方式 A：自动化脚本（推荐）

```powershell
# Windows — 会提示输入 yes 确认生产库
.\scripts\deploy.ps1 -Migrate -Seed
```

```bash
# Git Bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh --migrate --seed
```

其他组合：

| 命令 | 作用 |
|------|------|
| `./scripts/deploy.sh --migrate` | 仅迁移 |
| `./scripts/deploy.sh --full` | 迁移 + seed + `vercel --prod` |

### 方式 B：手动命令

```powershell
# 若未用 pull-env，需先加载 .env.deploy 中的变量，或手动 $env:DATABASE_URL=...
pnpm db:deploy
pnpm db:seed
```

**成功标志**：

```text
Applying migration ...
All migrations have been successfully applied.
```

---

## 第 7 步：生产环境功能自测

在浏览器打开生产域名，按顺序检查：

| # | 操作 | 预期 |
|---|------|------|
| 1 | 打开 `/` | 未登录跳转登录或显示引导 |
| 2 | `/login` 用 `demo@example.com` / `demo123456` | 登录成功进入首页 |
| 3 | `/recommendations` | 显示推荐课程卡片 |
| 4 | 进入任意课程学习 | 中文 + 日文释义正常 |
| 5 | `admin@example.com` 登录 → `/admin` | 管理后台可访问 |
| 6 | 退出再登录 | Session 正常，无立刻 401 |

---

## 第 8 步：自定义域名（可选）

### 7.1 在 Vercel 添加域名

1. **Settings → Domains**
2. 输入 `chinese-learn.jp`（你的域名）→ **Add**
3. 按提示在域名注册商添加 DNS：

| 类型 | 名称 | 值 |
|------|------|-----|
| CNAME | `www` | `cname.vercel-dns.com` |
| 或 A | `@` | Vercel 提供的 IP |

### 7.2 更新 Auth 并 Redeploy

1. **Environment Variables** → `NEXTAUTH_URL` → `https://chinese-learn.jp`
2. **Deployments → Redeploy**

**成功标志**：Domains 页显示 **Valid Configuration** 绿色勾。

---

## 界面速查（你要找的按钮在哪）

```text
vercel.com/dashboard
├── [Add New…] → Project          ← 导入新仓库
├── 项目卡片 → 进入项目
│   ├── [Visit]                   ← 打开生产站
│   ├── Deployments               ← 查看构建日志 / Redeploy
│   ├── Settings
│   │   ├── Environment Variables ← 改 DATABASE_URL / NEXTAUTH_URL
│   │   ├── Domains               ← 自定义域名
│   │   └── General               ← Project Name、Region（已由 vercel.json 设 bom1）
│   └── ...
```

---

## 与 DEPLOY.md 的关系

| 文档 | 用途 |
|------|------|
| [DEPLOY.md](../DEPLOY.md) | 原理、变量说明、Prisma/Auth 配置、检查清单 |
| 本文档 | Vercel 网页逐步点击说明 |
| [scripts/deploy.sh](../scripts/deploy.sh) | 迁移 / Seed / CLI 部署自动化 |
| [scripts/pull-vercel-env.mjs](../scripts/pull-vercel-env.mjs) | `pnpm deploy:pull-env` 同步 Vercel 变量 |
| [.env.deploy.template](../.env.deploy.template) | 含默认 `NEXTAUTH_URL` 的可提交模板 |

---

## 部署检查清单（可打印）

- [ ] GitHub 已推送，无 `.env` 泄露
- [ ] Supabase 6543 / 5432 连接串已准备且密码已 URL 编码
- [ ] Vercel Import 完成，Install Command = `pnpm install`
- [ ] 5 个环境变量已填入 Production
- [ ] 首次 Deploy 成功（绿色 Ready）
- [ ] `NEXTAUTH_URL` 已改为真实域名并 **Redeploy**
- [ ] 已执行 `pnpm deploy:pull-env` 生成 `.env.deploy`
- [ ] `NEXTAUTH_URL` 与 Vercel Domains 中生产域名一致
- [ ] 本地已执行 `.\scripts\deploy.ps1 -Migrate -Seed` 或 `./scripts/deploy.sh --migrate --seed`
- [ ] 演示账号登录、推荐页、Admin 已测
- [ ] （可选）自定义域名 + DNS + 再次更新 `NEXTAUTH_URL`
