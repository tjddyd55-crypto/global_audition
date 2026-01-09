# 배포 상태 확인 스크립트
# 사용법: .\scripts\check-deployment.ps1 -GatewayUrl "https://your-gateway.railway.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$GatewayUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Audition Platform - 배포 상태 확인" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Gateway URL 정리 (끝에 / 제거)
$GatewayUrl = $GatewayUrl.TrimEnd('/')

Write-Host "Gateway URL: $GatewayUrl" -ForegroundColor Yellow
Write-Host ""

# 헬스 체크 엔드포인트
$endpoints = @(
    @{Name="Gateway Health"; Path="/actuator/health"},
    @{Name="오디션 목록 (via Gateway)"; Path="/api/v1/auditions"},
    @{Name="비디오 목록 (via Gateway)"; Path="/api/v1/videos"}
)

$results = @()

foreach ($endpoint in $endpoints) {
    $url = "$GatewayUrl$($endpoint.Path)"
    Write-Host "확인 중: $($endpoint.Name)..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200) {
            Write-Host " ✓ 성공 (HTTP $statusCode)" -ForegroundColor Green
            $results += @{Name=$endpoint.Name; Status="성공"; Code=$statusCode}
        } else {
            Write-Host " ⚠ 경고 (HTTP $statusCode)" -ForegroundColor Yellow
            $results += @{Name=$endpoint.Name; Status="경고"; Code=$statusCode}
        }
    } catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host " ✗ 실패 (HTTP $statusCode)" -ForegroundColor Red
            $results += @{Name=$endpoint.Name; Status="실패"; Code=$statusCode; Error=$errorMessage}
        } else {
            Write-Host " ✗ 연결 실패" -ForegroundColor Red
            $results += @{Name=$endpoint.Name; Status="연결 실패"; Error=$errorMessage}
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "결과 요약" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = ($results | Where-Object { $_.Status -eq "성공" }).Count
$warningCount = ($results | Where-Object { $_.Status -eq "경고" }).Count
$failCount = ($results | Where-Object { $_.Status -ne "성공" -and $_.Status -ne "경고" }).Count

Write-Host "성공: $successCount" -ForegroundColor Green
Write-Host "경고: $warningCount" -ForegroundColor Yellow
Write-Host "실패: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✓ 모든 서비스가 정상적으로 작동 중입니다!" -ForegroundColor Green
} else {
    Write-Host "⚠ 일부 서비스에 문제가 있습니다. Railway 로그를 확인하세요." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "API 테스트:" -ForegroundColor Cyan
Write-Host "  Gateway: $GatewayUrl" -ForegroundColor White
Write-Host "  Health Check: $GatewayUrl/actuator/health" -ForegroundColor White
Write-Host ""
