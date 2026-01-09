# 로컬 서비스 시작 스크립트 (Railway PostgreSQL 사용)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Audition Platform - Local Services" -ForegroundColor Cyan
Write-Host "  (Railway PostgreSQL 사용)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 환경 변수 로드
Write-Host "[0/5] 환경 변수 로드 중..." -ForegroundColor Yellow
& "$scriptPath\load-env.ps1"
Write-Host ""

# 환경 변수 확인
$dbHost = $env:RAILWAY_DB_HOST
if (-not $dbHost) {
    Write-Host "경고: RAILWAY_DB_HOST 환경 변수가 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "      .env.local 파일을 확인하세요." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "[1/5] User Service 시작 중 (포트 8082)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\user-service'; `$env:SPRING_PROFILES_ACTIVE='local'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 5
Write-Host "✓ User Service 시작됨" -ForegroundColor Green
Write-Host ""

Write-Host "[2/5] Audition Service 시작 중 (포트 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\audition-service'; `$env:SPRING_PROFILES_ACTIVE='local'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 5
Write-Host "✓ Audition Service 시작됨" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Media Service 시작 중 (포트 8083)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\media-service'; `$env:SPRING_PROFILES_ACTIVE='local'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 5
Write-Host "✓ Media Service 시작됨" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Gateway 시작 중 (포트 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend\gateway'; `$env:SPRING_PROFILES_ACTIVE='local'; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized
Start-Sleep -Seconds 5
Write-Host "✓ Gateway 시작됨" -ForegroundColor Green
Write-Host ""

Write-Host "[5/5] 프론트엔드 시작 중 (포트 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend\web'; npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "✓ 프론트엔드 시작됨" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  서비스 접속 주소" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway:    http://localhost:8080" -ForegroundColor Green
Write-Host "User Service:   http://localhost:8082" -ForegroundColor Green
Write-Host "Audition Svc:   http://localhost:8081" -ForegroundColor Green
Write-Host "Media Service:  http://localhost:8083" -ForegroundColor Green
Write-Host "Frontend:       http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "데이터베이스: Railway PostgreSQL" -ForegroundColor Yellow
Write-Host "  Host: $dbHost" -ForegroundColor Gray
Write-Host ""
Write-Host "서비스가 시작되었습니다. 각 서비스는 별도 창에서 실행됩니다." -ForegroundColor Yellow
Write-Host ""
