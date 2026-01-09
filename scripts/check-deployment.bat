@echo off
REM 배포 상태 확인 스크립트 (Batch 버전)
REM 사용법: scripts\check-deployment.bat "https://your-gateway.railway.app"

if "%~1"=="" (
    echo 사용법: check-deployment.bat "https://your-gateway.railway.app"
    exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0check-deployment.ps1" -GatewayUrl "%~1"
