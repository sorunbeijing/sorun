# 从 Vercel 拉取 Production 环境变量 → .env.deploy
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
node scripts/pull-vercel-env.mjs @args
