# 환경 변수 로드 스크립트
# 사용법: . .\scripts\load-env.ps1

$envFile = Join-Path $PSScriptRoot ".." ".env.local"

if (Test-Path $envFile) {
    Write-Host "환경 변수 로드 중: $envFile" -ForegroundColor Green
    
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        # 주석과 빈 줄 건너뛰기
        if ($line -and -not $line.StartsWith("#")) {
            if ($line -match '^([^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "  $key = $value" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host "환경 변수 로드 완료!" -ForegroundColor Green
} else {
    Write-Host "경고: .env.local 파일을 찾을 수 없습니다." -ForegroundColor Yellow
    Write-Host "경로: $envFile" -ForegroundColor Yellow
    Write-Host "docs/LOCAL_TESTING_WITH_RAILWAY_DB.md 파일을 참고하여 .env.local 파일을 생성하세요." -ForegroundColor Yellow
}
