# DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION
param(
  [ValidateSet('seed', 'cleanup', 'reset')]
  [string]$Action = 'seed'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $repoRoot

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  throw 'Railway CLI is required. Install: npm i -g @railway/cli'
}

railway link -p global_audition -e development -s Postgres 2>$null | Out-Null
$json = railway variables --json | ConvertFrom-Json
$env:DATABASE_PUBLIC_URL = $json.DATABASE_PUBLIC_URL
$env:RAILWAY_ENVIRONMENT_NAME = $json.RAILWAY_ENVIRONMENT_NAME

if ($env:DATABASE_PUBLIC_URL -match 'postgres-production') {
  throw 'ABORT: production-like DATABASE_PUBLIC_URL detected.'
}

python "$PSScriptRoot/run-native-qa-seed.py" $Action
