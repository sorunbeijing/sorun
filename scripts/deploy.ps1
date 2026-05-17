# =============================================================================
# Windows PowerShell 版部署脚本（功能同 deploy.sh）
#
# 用法：
#   .\scripts\deploy.ps1 -Migrate -Seed
#   .\scripts\deploy.ps1 -Migrate
#   .\scripts\deploy.ps1 -Full
#   .\scripts\deploy.ps1 -EnvFile .env.deploy -Migrate -Seed -Yes
# =============================================================================

param(
    [switch]$Migrate,
    [switch]$Seed,
    [switch]$Vercel,
    [switch]$Full,
    [string]$EnvFile = ".env.deploy",
    [switch]$Yes
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Write-DeployLog($msg) { Write-Host "[deploy] $msg" -ForegroundColor Green }
function Write-DeployWarn($msg) { Write-Host "[deploy] $msg" -ForegroundColor Yellow }
function Write-DeployErr($msg)  { Write-Host "[deploy] $msg" -ForegroundColor Red }

if ($Full) {
    $Migrate = $true
    $Seed = $true
    $Vercel = $true
}

if (-not ($Migrate -or $Seed -or $Vercel)) {
    Write-DeployErr "请指定 -Migrate、-Seed、-Vercel 或 -Full"
    exit 1
}

function Load-EnvFile($path) {
    if (-not (Test-Path $path)) {
        Write-DeployErr "环境变量文件不存在: $path"
        Write-DeployErr "请执行: Copy-Item .env.deploy.example .env.deploy"
        exit 1
    }
    Write-DeployLog "加载环境变量: $path"
    Get-Content $path | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

function Test-RequiredVars {
    if (-not $env:DATABASE_URL) { Write-DeployErr "缺少 DATABASE_URL"; exit 1 }
    if (-not $env:DIRECT_URL)   { Write-DeployErr "缺少 DIRECT_URL"; exit 1 }
    if ($env:DATABASE_URL -notmatch "pgbouncer=true") {
        Write-DeployWarn "DATABASE_URL 建议包含 ?pgbouncer=true"
    }
}

function Confirm-Production {
    if ($Yes) { return }
    $db = $env:DATABASE_URL -replace '@.*','@***'
    $direct = $env:DIRECT_URL -replace '@.*','@***'
    Write-DeployWarn "即将对生产库执行操作:"
    Write-Host "  DATABASE_URL → $db"
    Write-Host "  DIRECT_URL   → $direct"
    $ans = Read-Host "输入 yes 继续"
    if ($ans -ne "yes") { Write-DeployErr "已取消"; exit 1 }
}

if ($Migrate -or $Seed) {
    Load-EnvFile $EnvFile
    Test-RequiredVars
    Confirm-Production
}

if ($Migrate) {
    Write-DeployLog "执行 prisma migrate deploy ..."
    pnpm db:deploy
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($Seed) {
    Write-DeployLog "执行 prisma db seed ..."
    pnpm db:seed
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($Vercel) {
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-DeployErr "未找到 vercel CLI，请运行: npm i -g vercel"
        exit 1
    }
    if (-not (Test-Path ".vercel")) {
        Write-DeployWarn "运行 vercel link ..."
        vercel link
    }
    Write-DeployLog "触发 Vercel 生产部署 ..."
    vercel --prod
}

Write-DeployLog "全部完成"
