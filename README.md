# 中文学习软件（兴趣定制版）

基于 Next.js 14、Prisma、PostgreSQL 的中文学习 MVP。按兴趣与水平推荐课程，支持学习、测验与间隔复习。

## 技术栈

- Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui
- Prisma · PostgreSQL（Supabase 可用）
- NextAuth v5（Credentials）
- Zod · React Hook Form

## 环境要求

- Node.js 20+
- pnpm 9+
- 可访问的 PostgreSQL 数据库

## 快速开始

```bash
pnpm install
cp .env.example .env
# 编辑 .env：填写 DATABASE_URL、NEXTAUTH_SECRET、NEXTAUTH_URL

pnpm db:push
pnpm db:seed
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### Supabase 连接说明

| 场景 | 端口 | 说明 |
|------|------|------|
| `pnpm db:push` / `db:seed` | **5432** | 直连或 Session pooler，Prisma 迁移需要完整 SQL 能力 |
| `pnpm dev` 运行时 | **6543** | Transaction pooler，连接串末尾加 `?pgbouncer=true` |

密码含特殊字符（如 `!`）时请 URL 编码。

生成 `NEXTAUTH_SECRET`（任选其一）：

```bash
openssl rand -base64 32
# 或 Node: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 演示账号（seed）

| 账号 | 密码 | 说明 |
|------|------|------|
| `demo@example.com` | `demo123456` | 已选动漫+美食兴趣，可直接进首页 |
| `admin@example.com` | `demo123456` | 管理员，可访问 `/admin` |

## 手动闭环测试（第 6 步）

1. 打开 `/register` 注册新用户，或 `/login` 使用演示账号
2. 新用户：`/onboarding/interests` 选兴趣 → `/onboarding/level` 选水平
3. `/home` 查看推荐，点击课程进入 `/lessons/[id]`
4. 「开始学习」→ `/learn/[id]` 逐步学习至「完成并测验」
5. `/quiz/[id]` 提交测验
6. `/review` 查看并完成复习项
7. `/profile` 查看个人信息

### API 冒烟（无需登录部分）

```bash
pnpm dev
# 另开终端
pnpm test:smoke
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | 运行时连接（Supabase 6543 pooler + `?pgbouncer=true`） |
| `DIRECT_URL` | 是 | 迁移/seed 用直连（5432，无 pgbouncer） |
| `NEXTAUTH_URL` | 是 | 本地 `http://localhost:3000` |
| `NEXTAUTH_SECRET` | 是 | JWT/Session 密钥，≥32 字符 |

完整说明见 [`.env.example`](./.env.example)。**生产部署**见 **[DEPLOY.md](./DEPLOY.md)**；Vercel 逐步操作见 **[docs/VERCEL-WALKTHROUGH.md](./docs/VERCEL-WALKTHROUGH.md)**。同步 Vercel 变量：**`pnpm deploy:pull-env`**；迁移 **`.\scripts\deploy.ps1 -Migrate -Seed`**。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 生产运行 |
| `pnpm db:push` | 同步 Prisma schema 到数据库 |
| `pnpm db:deploy` | 生产环境执行 Prisma 迁移 |
| `pnpm db:seed` | 写入兴趣标签、课程模板、演示用户 |
| `pnpm db:studio` | 可视化管理数据 |
| `pnpm test:smoke` | 公开 API 冒烟测试 |

## API 约定

统一响应：

```json
{ "code": 0, "message": "success", "data": {} }
```

常见 `code`：`0` 成功 · `40100` 未登录 · `40400` 不存在 · `42200` 校验失败 · `50000` 服务器错误

主要路由见 `src/app/api/v1/`。

## 项目结构

```
src/
  app/                 # 页面 + API Route Handlers
  components/          # UI、布局、课程卡片
  lib/                 # prisma、api-client、推荐逻辑、鉴权
prisma/
  schema.prisma        # 12 张业务表
  seed.ts              # 种子数据
scripts/
  e2e-smoke.mjs        # API 冒烟
```

## 功能自检清单

### P0（核心）

- [x] 注册 / 登录（`/register`、`/login` + NextAuth session）
- [x] 兴趣标签 GET、用户兴趣 POST/GET
- [x] 首页推荐（规则：复习到期 > 主兴趣 > 水平 > 久未学 > 主题多样 > 时长）
- [x] 课程详情、开始、进度、完成
- [x] 测验获取与提交
- [x] 复习队列与完成
- [x] 个人中心

### P1（扩展）

- [x] 收藏 CRUD
- [x] 学习统计
- [x] 推荐原因 `GET /api/v1/recommendations/{lesson_id}/reason`
- [x] 基础后台 `/admin`（管理员 + Prisma Studio 指引）

## 故障排查

| 现象 | 处理 |
|------|------|
| `db:push` 失败 | 检查 `DATABASE_URL` 是否用 5432 直连；防火墙是否放行 |
| 登录后接口 401 | 确认 `NEXTAUTH_SECRET` 已设置；浏览器请求需带 cookie |
| 首页无推荐 | 先完成兴趣选择；点击刷新或访问 `/recommendations` |
| 构建警告 `useEffect` | 已用 `useCallback` 处理首页加载依赖 |

## 安全提示

- 切勿将 `.env` 或真实数据库密码提交到 Git
- `.env.example` 仅含占位符，请在本机 `.env` 填写真实配置
