# PostgreSQL 데이터베이스 시작 스크립트

Write-Host "=== PostgreSQL 데이터베이스 시작 ===" -ForegroundColor Cyan
Write-Host ""

# Docker가 설치되어 있는지 확인
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerAvailable) {
    Write-Host "Docker를 사용하여 PostgreSQL을 시작합니다..." -ForegroundColor Yellow
    Write-Host ""
    
    # docker-compose.yml이 있는 디렉토리로 이동
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $scriptDir
    
    # PostgreSQL 컨테이너 시작
    Write-Host "PostgreSQL 컨테이너 시작 중..." -ForegroundColor Yellow
    docker-compose up -d postgres
    
    Write-Host ""
    Write-Host "PostgreSQL이 시작되었습니다." -ForegroundColor Green
    Write-Host "연결 정보:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: 5432" -ForegroundColor White
    Write-Host "  Database: audition_db" -ForegroundColor White
    Write-Host "  Username: audition_user" -ForegroundColor White
    Write-Host "  Password: audition_pass" -ForegroundColor White
    Write-Host ""
    Write-Host "상태 확인: docker ps" -ForegroundColor Gray
} else {
    Write-Host "Docker가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "다음 중 하나를 수행하세요:" -ForegroundColor Yellow
    Write-Host "1. Docker Desktop 설치 및 시작" -ForegroundColor White
    Write-Host "2. 로컬 PostgreSQL 서비스 시작" -ForegroundColor White
    Write-Host ""
    Write-Host "로컬 PostgreSQL을 사용하는 경우:" -ForegroundColor Cyan
    Write-Host "  - 데이터베이스: audition_db" -ForegroundColor White
    Write-Host "  - 사용자: audition_user" -ForegroundColor White
    Write-Host "  - 비밀번호: audition_pass" -ForegroundColor White
}

Write-Host ""
Write-Host "데이터베이스가 준비되면 User Service를 시작할 수 있습니다." -ForegroundColor Green
