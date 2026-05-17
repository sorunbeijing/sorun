#!/usr/bin/env bash
# =============================================================================
# 中文学习软件 — 生产部署辅助脚本
#
# 用途：
#   - 对生产 Supabase 执行 Prisma 迁移与 Seed（在本地运行，不经过 Vercel 构建）
#   - 可选：通过 Vercel CLI 触发生产部署
#
# 用法：
#   ./scripts/deploy.sh --migrate              # 仅 prisma migrate deploy
#   ./scripts/deploy.sh --seed                 # 仅 seed
#   ./scripts/deploy.sh --migrate --seed       # 迁移 + seed（首次部署推荐）
#   ./scripts/deploy.sh --vercel               # vercel --prod（需已 vercel link）
#   ./scripts/deploy.sh --full                 # migrate + seed + vercel --prod
#   ./scripts/deploy.sh --env-file .env.deploy # 指定环境变量文件
#   ./scripts/deploy.sh --help
#
# Windows：请用 Git Bash 或 WSL 运行；PowerShell 用户见 scripts/deploy.ps1
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.deploy}"
DO_MIGRATE=false
DO_SEED=false
DO_VERCEL=false
SKIP_CHECKS=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
err()  { echo -e "${RED}[deploy]${NC} $*" >&2; }

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

load_env_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    err "环境变量文件不存在: $file"
    err "请执行: cp .env.deploy.example .env.deploy  并填入生产库连接串"
    exit 1
  fi
  log "加载环境变量: $file"
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "未找到命令: $1"
    exit 1
  fi
}

check_required_vars() {
  local missing=()
  [[ -z "${DATABASE_URL:-}" ]] && missing+=("DATABASE_URL")
  [[ -z "${DIRECT_URL:-}" ]]     && missing+=("DIRECT_URL")

  if [[ ${#missing[@]} -gt 0 ]]; then
    err "缺少必填环境变量: ${missing[*]}"
    exit 1
  fi

  if [[ "$DATABASE_URL" != *"pgbouncer=true"* ]]; then
    warn "DATABASE_URL 建议包含 ?pgbouncer=true（Supabase 6543 pooler）"
  fi
  if [[ "$DIRECT_URL" == *"pgbouncer=true"* ]]; then
    warn "DIRECT_URL 不应包含 pgbouncer=true（迁移请用 5432 直连）"
  fi
  if [[ "$DATABASE_URL" == *":5432/"* ]]; then
    warn "DATABASE_URL 使用了 5432 端口；运行时建议用 6543 pooler"
  fi
}

confirm_production() {
  if [[ "${SKIP_CHECKS}" == "true" ]]; then
    return 0
  fi
  echo ""
  warn "即将对以下数据库执行操作（请确认是【生产】库）："
  echo "  DATABASE_URL → ${DATABASE_URL%%@*}@***"
  echo "  DIRECT_URL   → ${DIRECT_URL%%@*}@***"
  echo ""
  read -r -p "输入 yes 继续: " ans
  if [[ "$ans" != "yes" ]]; then
    err "已取消"
    exit 1
  fi
}

run_migrate() {
  log "执行 prisma migrate deploy ..."
  pnpm db:deploy
  log "迁移完成"
}

run_seed() {
  log "执行 prisma db seed ..."
  pnpm db:seed
  log "Seed 完成"
}

run_vercel() {
  require_cmd vercel
  if [[ ! -d ".vercel" ]]; then
    warn "未检测到 .vercel 目录，将运行 vercel link（请选择正确项目）"
    vercel link
  fi
  log "触发 Vercel 生产部署 (vercel --prod) ..."
  vercel --prod
  log "Vercel 部署已提交；请在 Dashboard 查看构建状态"
  if [[ -n "${NEXTAUTH_URL:-}" ]]; then
    log "部署后请确认 Vercel 中 NEXTAUTH_URL = ${NEXTAUTH_URL}"
  else
    warn "未设置 NEXTAUTH_URL；请在 Vercel Environment Variables 中配置并 Redeploy"
  fi
}

# --- parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --migrate)     DO_MIGRATE=true ;;
    --seed)        DO_SEED=true ;;
    --vercel)      DO_VERCEL=true ;;
    --full)        DO_MIGRATE=true; DO_SEED=true; DO_VERCEL=true ;;
    --env-file)    shift; ENV_FILE="${1:?缺少 --env-file 参数}" ;;
    --yes|-y)      SKIP_CHECKS=true ;;
    --help|-h)     usage ;;
    *)
      err "未知参数: $1"
      usage
      ;;
  esac
  shift
done

if ! $DO_MIGRATE && ! $DO_SEED && ! $DO_VERCEL; then
  err "请至少指定一个操作: --migrate | --seed | --vercel | --full"
  echo ""
  usage
fi

# --- prerequisites ---
require_cmd node
require_cmd pnpm

if $DO_MIGRATE || $DO_SEED; then
  load_env_file "$ENV_FILE"
  check_required_vars
  confirm_production
fi

# --- run ---
if $DO_MIGRATE; then
  run_migrate
fi

if $DO_SEED; then
  run_seed
fi

if $DO_VERCEL; then
  # Vercel CLI 使用项目内 .vercel 与 Dashboard 环境变量，不强制加载 .env.deploy
  if [[ -f "$ENV_FILE" ]] && [[ -z "${VERCEL_TOKEN:-}" ]]; then
    log "提示: Vercel 构建使用 Dashboard 中的环境变量，与 .env.deploy 无关"
  fi
  run_vercel
fi

log "全部完成 ✓"
