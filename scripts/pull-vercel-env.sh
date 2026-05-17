#!/usr/bin/env bash
# 从 Vercel 拉取 Production 环境变量 → .env.deploy
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/pull-vercel-env.mjs "$@"
