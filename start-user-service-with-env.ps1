# User Service 시작 스크립트 (환경 변수 포함)

$ErrorActionPreference = "Continue"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "=== User Service Start ===" -ForegroundColor Cyan
Write-Host ""

# 환경 변수 로드
Write-Host "[1/3] Loading environment variables..." -ForegroundColor Yellow
$envFile = ".\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            if ($line -match '^([^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    Write-Host "  Environment variables loaded from .env.local" -ForegroundColor Green
    Write-Host "  DB Host: $env:RAILWAY_DB_HOST" -ForegroundColor Gray
    Write-Host "  DB Port: $env:RAILWAY_DB_PORT" -ForegroundColor Gray
} else {
    Write-Host "  Warning: .env.local file not found!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/3] Setting Spring profile..." -ForegroundColor Yellow
$env:SPRING_PROFILES_ACTIVE = "local"
Write-Host "  Profile: local" -ForegroundColor Green

Write-Host ""
Write-Host "[3/3] Starting User Service..." -ForegroundColor Yellow
Write-Host "  Working directory: $projectRoot\backend\user-service" -ForegroundColor Gray
Write-Host ""

Set-Location "$projectRoot\backend\user-service"

# User Service 시작 (현재 창에서 실행)
.\mvnw.cmd spring-boot:run
