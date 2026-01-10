# 전체 서비스 시작 스크립트 (최종 버전)

$ErrorActionPreference = "Continue"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Audition Platform - All Services" -ForegroundColor Cyan
Write-Host "  (Railway PostgreSQL)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 환경 변수 로드
Write-Host "[0/5] Loading environment variables..." -ForegroundColor Yellow
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
    Write-Host "  Environment variables loaded" -ForegroundColor Green
    Write-Host "  DB Host: $env:RAILWAY_DB_HOST" -ForegroundColor Gray
} else {
    Write-Host "  Warning: .env.local file not found!" -ForegroundColor Yellow
}
Write-Host ""

# 각 서비스를 별도 PowerShell 창에서 시작
$services = @(
    @{Name="User Service"; Port=8082; Path="backend\user-service"},
    @{Name="Audition Service"; Port=8081; Path="backend\audition-service"},
    @{Name="Media Service"; Port=8083; Path="backend\media-service"},
    @{Name="Gateway"; Port=8080; Path="backend\gateway"}
)

$serviceIndex = 1
foreach ($service in $services) {
    Write-Host "[$serviceIndex/5] Starting $($service.Name) (Port $($service.Port))..." -ForegroundColor Yellow
    
    $scriptBlock = @"
cd '$projectRoot\$($service.Path)'
`$env:SPRING_PROFILES_ACTIVE = 'local'
`$envFile = '$projectRoot\.env.local'
if (Test-Path `$envFile) {
    Get-Content `$envFile | ForEach-Object {
        `$line = `$_.Trim()
        if (`$line -and -not `$line.StartsWith('#')) {
            if (`$line -match '^([^=]+)=(.*)$') {
                `$key = `$matches[1].Trim()
                `$value = `$matches[2].Trim()
                [Environment]::SetEnvironmentVariable(`$key, `$value, 'Process')
            }
        }
    }
}
.\mvnw.cmd spring-boot:run
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $scriptBlock -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-Host "  $($service.Name) started" -ForegroundColor Green
    Write-Host ""
    $serviceIndex++
}

Write-Host "[5/5] Starting Frontend (Port 3000)..." -ForegroundColor Yellow
$frontendScript = @"
cd '$projectRoot\frontend\web'
npm run dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Minimized
Start-Sleep -Seconds 2
Write-Host "  Frontend started" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Service URLs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway:    http://localhost:8080" -ForegroundColor Green
Write-Host "User Service:   http://localhost:8082" -ForegroundColor Green
Write-Host "Audition Svc:   http://localhost:8081" -ForegroundColor Green
Write-Host "Media Service:  http://localhost:8083" -ForegroundColor Green
Write-Host "Frontend:       http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "All services have been started." -ForegroundColor Yellow
Write-Host "Please wait 30-60 seconds for all services to fully start." -ForegroundColor Yellow
Write-Host ""
