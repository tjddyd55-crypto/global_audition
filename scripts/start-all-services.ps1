# 전체 서비스 시작 스크립트 (Windows PowerShell)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Audition Platform - Service Starter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Docker Compose로 인프라 시작
Write-Host "[1/5] Starting Docker infrastructure..." -ForegroundColor Yellow
try {
    docker-compose up -d
    Write-Host "✓ Docker infrastructure started" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start Docker infrastructure: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 데이터베이스 대기
Write-Host "[2/5] Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✓ Database ready" -ForegroundColor Green
Write-Host ""

# User Service 시작
Write-Host "[3/5] Starting User Service (port 8082)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\user-service'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "✓ User Service starting" -ForegroundColor Green
Write-Host ""

# Audition Service 시작
Write-Host "[4/5] Starting Audition Service (port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\audition-service'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "✓ Audition Service starting" -ForegroundColor Green
Write-Host ""

# Media Service 시작
Write-Host "[5/5] Starting Media Service (port 8083)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\media-service'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "✓ Media Service starting" -ForegroundColor Green
Write-Host ""

# Gateway 시작
Write-Host "[6/6] Starting API Gateway (port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\gateway'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "✓ API Gateway starting" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway:    http://localhost:8080" -ForegroundColor Green
Write-Host "User Service:  http://localhost:8082" -ForegroundColor Green
Write-Host "Audition Svc:  http://localhost:8081" -ForegroundColor Green
Write-Host "Media Service: http://localhost:8083" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:       http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "서비스가 시작되었습니다. 각 서비스는 별도 창에서 실행됩니다." -ForegroundColor Yellow
Write-Host ""
