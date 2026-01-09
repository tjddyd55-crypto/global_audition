# 배포 스크립트 (임시 서버용)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Audition Platform - Build & Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 백엔드 서비스 빌드
Write-Host "[1/4] Building backend services..." -ForegroundColor Yellow

$services = @("user-service", "audition-service", "media-service", "gateway")

foreach ($service in $services) {
    Write-Host "  Building $service..." -ForegroundColor DarkGray
    Push-Location "$projectRoot\backend\$service"
    try {
        .\mvnw.cmd clean package -DskipTests 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $service built successfully" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $service build failed" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    } catch {
        Write-Host "  ✗ $service build error: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

Write-Host "✓ All backend services built" -ForegroundColor Green
Write-Host ""

# 프론트엔드 빌드
Write-Host "[2/4] Building frontend..." -ForegroundColor Yellow
Push-Location "$projectRoot\frontend\web"
try {
    if (Test-Path "node_modules") {
        npm run build 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Frontend built successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Frontend build failed" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    } else {
        Write-Host "⚠ node_modules not found. Run 'npm install' first." -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Frontend build error: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Docker 이미지 빌드 (선택사항)
Write-Host "[3/4] Building Docker images..." -ForegroundColor Yellow
Write-Host "  (Docker build는 선택사항입니다)" -ForegroundColor DarkGray
Write-Host ""

# 배포 정보 출력
Write-Host "[4/4] Deployment Information" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "JAR 파일 위치:" -ForegroundColor Green
foreach ($service in $services) {
    $jarPath = "$projectRoot\backend\$service\target\$service-1.0.0-SNAPSHOT.jar"
    if (Test-Path $jarPath) {
        Write-Host "  $service: $jarPath" -ForegroundColor DarkGray
    }
}
Write-Host ""
Write-Host "실행 방법:" -ForegroundColor Green
Write-Host "  java -jar backend\user-service\target\user-service-1.0.0-SNAPSHOT.jar" -ForegroundColor DarkGray
Write-Host "  java -jar backend\audition-service\target\audition-service-1.0.0-SNAPSHOT.jar" -ForegroundColor DarkGray
Write-Host "  java -jar backend\media-service\target\media-service-1.0.0-SNAPSHOT.jar" -ForegroundColor DarkGray
Write-Host "  java -jar backend\gateway\target\gateway-1.0.0-SNAPSHOT.jar" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✓ Build completed!" -ForegroundColor Green
Write-Host ""
