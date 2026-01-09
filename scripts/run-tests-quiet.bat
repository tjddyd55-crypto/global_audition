@echo off
REM 전체 테스트 실행 배치 파일 (Windows) - 조용한 모드
REM PowerShell 실행 정책 문제를 우회하기 위한 배치 파일

cd /d "%~dp0\.."
powershell -ExecutionPolicy Bypass -File "%~dp0run-all-tests-quiet.ps1"
