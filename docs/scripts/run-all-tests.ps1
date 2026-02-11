# 전체 테스트 실행 스크립트 (Windows PowerShell)

# 스크립트가 실행되는 디렉토리를 기준으로 프로젝트 루트 찾기
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

# 프로젝트 루트로 이동
Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Audition Platform - Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project Root: $projectRoot" -ForegroundColor Gray
Write-Host ""

$ErrorActionPreference = "Continue"
$testResults = @{}

# Audition Service 테스트
Write-Host "[1/4] Testing Audition Service..." -ForegroundColor Yellow
try {
    Push-Location "$projectRoot\backend\services\audition-service"
    if (Test-Path "mvnw.cmd") {
        & .\mvnw.cmd test 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $testResults["Audition Service"] = "PASSED"
            Write-Host "✓ Audition Service tests passed" -ForegroundColor Green
        } else {
            $testResults["Audition Service"] = "FAILED"
            Write-Host "✗ Audition Service tests failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Maven wrapper not found. Using 'mvn test' instead..." -ForegroundColor Yellow
        mvn test
        if ($LASTEXITCODE -eq 0) {
            $testResults["Audition Service"] = "PASSED"
        } else {
            $testResults["Audition Service"] = "FAILED"
        }
    }
    Pop-Location
} catch {
    Write-Host "Error testing Audition Service: $_" -ForegroundColor Red
    $testResults["Audition Service"] = "ERROR"
}
Write-Host ""

# User Service 테스트
Write-Host "[2/4] Testing User Service..." -ForegroundColor Yellow
try {
    Push-Location "$projectRoot\backend\services\user-service"
    if (Test-Path "mvnw.cmd") {
        & .\mvnw.cmd test 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $testResults["User Service"] = "PASSED"
            Write-Host "✓ User Service tests passed" -ForegroundColor Green
        } else {
            $testResults["User Service"] = "FAILED"
            Write-Host "✗ User Service tests failed" -ForegroundColor Red
        }
    } else {
        mvn test
        if ($LASTEXITCODE -eq 0) {
            $testResults["User Service"] = "PASSED"
        } else {
            $testResults["User Service"] = "FAILED"
        }
    }
    Pop-Location
} catch {
    Write-Host "Error testing User Service: $_" -ForegroundColor Red
    $testResults["User Service"] = "ERROR"
}
Write-Host ""

# Media Service 테스트
Write-Host "[3/4] Testing Media Service..." -ForegroundColor Yellow
try {
    Push-Location "$projectRoot\backend\services\media-service"
    if (Test-Path "mvnw.cmd") {
        & .\mvnw.cmd test 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $testResults["Media Service"] = "PASSED"
            Write-Host "✓ Media Service tests passed" -ForegroundColor Green
        } else {
            $testResults["Media Service"] = "FAILED"
            Write-Host "✗ Media Service tests failed" -ForegroundColor Red
        }
    } else {
        mvn test
        if ($LASTEXITCODE -eq 0) {
            $testResults["Media Service"] = "PASSED"
        } else {
            $testResults["Media Service"] = "FAILED"
        }
    }
    Pop-Location
} catch {
    Write-Host "Error testing Media Service: $_" -ForegroundColor Red
    $testResults["Media Service"] = "ERROR"
}
Write-Host ""

# Frontend 테스트
Write-Host "[4/4] Testing Frontend..." -ForegroundColor Yellow
try {
    Push-Location "$projectRoot\frontend\web"
    if (Test-Path "node_modules") {
        npm test -- --passWithNoTests
        if ($LASTEXITCODE -eq 0) {
            $testResults["Frontend"] = "PASSED"
            Write-Host "✓ Frontend tests passed" -ForegroundColor Green
        } else {
            $testResults["Frontend"] = "FAILED"
            Write-Host "✗ Frontend tests failed" -ForegroundColor Red
        }
    } else {
        Write-Host "node_modules not found. Run 'npm install' first." -ForegroundColor Yellow
        $testResults["Frontend"] = "SKIPPED"
    }
    Pop-Location
} catch {
    Write-Host "Error testing Frontend: $_" -ForegroundColor Red
    $testResults["Frontend"] = "ERROR"
}
Write-Host ""

# 결과 요약
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
foreach ($result in $testResults.GetEnumerator()) {
    $color = if ($result.Value -eq "PASSED") { "Green" } 
             elseif ($result.Value -eq "FAILED") { "Red" }
             else { "Yellow" }
    Write-Host "$($result.Key): $($result.Value)" -ForegroundColor $color
}
Write-Host ""
