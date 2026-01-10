# Frontend 시작 스크립트

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$frontendPath = Join-Path $projectRoot "frontend\web"

Set-Location $frontendPath

# Node.js 경로 확인
$nodePath = $null
if (Test-Path "C:\Program Files\nodejs\npm.cmd") {
    $nodePath = "C:\Program Files\nodejs"
} elseif (Test-Path "$env:ProgramFiles\nodejs\npm.cmd") {
    $nodePath = "$env:ProgramFiles\nodejs"
} elseif (Test-Path "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd") {
    $nodePath = "$env:LOCALAPPDATA\Programs\nodejs"
}

if (-not $nodePath) {
    Write-Host "오류: Node.js를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "Node.js가 설치되어 있는지 확인하고 PowerShell을 재시작하세요." -ForegroundColor Yellow
    exit 1
}

# PATH에 Node.js 추가
$env:Path = "$nodePath;$env:Path"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# node_modules 확인 및 설치
if (-not (Test-Path "node_modules")) {
    Write-Host "npm install 실행 중..." -ForegroundColor Yellow
    & "$nodePath\npm.cmd" install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install 실패" -ForegroundColor Red
        exit 1
    }
    Write-Host "npm install 완료" -ForegroundColor Green
    Write-Host ""
}

# Frontend 시작
Write-Host "Frontend 시작 중..." -ForegroundColor Yellow
& "$nodePath\npm.cmd" run dev
