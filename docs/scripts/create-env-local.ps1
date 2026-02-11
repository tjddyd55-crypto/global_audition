# .env.local 파일 생성 스크립트
# 사용법: .\scripts\create-env-local.ps1

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$envFile = Join-Path $projectRoot ".env.local"

$dbUrl = Read-Host "Railway DATABASE_PUBLIC_URL을 입력하세요"

if ($dbUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $user = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
    
    $content = @"
# Railway PostgreSQL 연결 정보
# 자동 생성됨: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

RAILWAY_DB_HOST=$host
RAILWAY_DB_PORT=$port
RAILWAY_DB_NAME=$database
RAILWAY_DB_USER=$user
RAILWAY_DB_PASSWORD=$password
"@
    
    $content | Out-File -FilePath $envFile -Encoding UTF8 -NoNewline
    
    Write-Host ""
    Write-Host ".env.local 파일이 생성되었습니다!" -ForegroundColor Green
    Write-Host "경로: $envFile" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "오류: DATABASE_URL 형식이 올바르지 않습니다." -ForegroundColor Red
    Write-Host "형식: postgresql://user:password@host:port/database" -ForegroundColor Yellow
}
