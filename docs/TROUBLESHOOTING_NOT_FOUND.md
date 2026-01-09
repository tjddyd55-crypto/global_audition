# Not Found 오류 해결 가이드

## 🔍 문제: `/api/v1/videos` 엔드포인트에서 Not Found

### 가능한 원인

1. **Media Service가 배포되지 않음**
2. **Gateway의 MEDIA_SERVICE_URL이 잘못 설정됨**
3. **Media Service가 정상 작동하지 않음**
4. **Gateway 라우팅 설정 문제**

## ✅ 해결 방법

### 1단계: Media Service 배포 확인

Railway 대시보드에서:
1. `media-service` 서비스가 있는지 확인
2. **Deployments** 탭에서 배포 상태 확인
   - ✅ **Deployed**: 정상
   - ⏳ **Building**: 빌드 중 (기다리기)
   - ❌ **Failed**: 배포 실패 (로그 확인)

### 2단계: Media Service 로그 확인

1. Media Service 선택
2. **Logs** 탭 확인
3. 다음 메시지 확인:
   - ✅ `Started MediaServiceApplication in ... seconds`
   - ❌ 에러 메시지 확인

**일반적인 에러:**
- 데이터베이스 연결 실패
- 환경 변수 누락
- 포트 충돌

### 3단계: Media Service 직접 접속 테스트

Media Service의 Public URL로 직접 접속:

```
https://your-media-service.railway.app/actuator/health
```

**예상 응답:**
```json
{"status":"UP"}
```

**Not Found가 나오면:**
- Media Service가 정상 작동하지 않음
- 로그에서 에러 확인

### 4단계: Gateway 환경 변수 확인

Gateway의 **Settings → Variables**에서:

```
MEDIA_SERVICE_URL=https://your-media-service.railway.app
```

**확인 사항:**
- [ ] `MEDIA_SERVICE_URL`이 설정되어 있는지
- [ ] URL이 `https://`로 시작하는지
- [ ] URL 끝에 `/`가 없는지
- [ ] Media Service의 실제 Public URL과 일치하는지

**Public URL 확인 방법:**
1. Media Service 선택
2. Settings → Networking
3. Public URL 복사
4. Gateway의 `MEDIA_SERVICE_URL`에 입력

### 5단계: Gateway 라우팅 확인

Gateway의 **Logs** 탭에서:
- Media Service로의 라우팅 시도 로그 확인
- 502 Bad Gateway 에러 확인

**502 에러가 나오면:**
- Media Service가 정상 작동하지 않음
- `MEDIA_SERVICE_URL`이 잘못 설정됨

## 🔧 단계별 체크리스트

### Media Service 체크리스트
- [ ] Media Service가 Railway에 배포되어 있음
- [ ] 배포 상태가 "Deployed"
- [ ] 로그에 에러 없음
- [ ] `/actuator/health` 엔드포인트가 정상 작동
- [ ] 환경 변수 설정 완료:
  - [ ] `SPRING_PROFILES_ACTIVE=production`
  - [ ] `DATABASE_URL` 설정

### Gateway 체크리스트
- [ ] Gateway가 배포되어 있음
- [ ] `MEDIA_SERVICE_URL` 환경 변수 설정
- [ ] `MEDIA_SERVICE_URL`이 올바른 URL인지 확인
- [ ] Gateway 로그에 에러 없음

## 🧪 테스트 방법

### 1. Media Service 직접 테스트
```bash
curl https://your-media-service.railway.app/actuator/health
```

### 2. Media Service API 직접 테스트
```bash
curl https://your-media-service.railway.app/api/v1/videos
```

**응답:**
- ✅ `{"content":[],"totalElements":0,...}` → 정상 (데이터 없음)
- ❌ `Not Found` → 서비스 문제

### 3. Gateway를 통한 테스트
```bash
curl https://your-gateway.railway.app/api/v1/videos
```

**응답:**
- ✅ `{"content":[],"totalElements":0,...}` → 정상
- ❌ `Not Found` → Gateway 라우팅 문제

## 🚨 추가 문제 해결

### Media Service가 시작되지 않음

**원인:**
- 데이터베이스 연결 실패
- 환경 변수 누락

**해결:**
1. Media Service 로그 확인
2. `DATABASE_URL` 환경 변수 확인
3. PostgreSQL 서비스 연결 확인

### Gateway 502 Bad Gateway

**원인:**
- Media Service URL이 잘못됨
- Media Service가 작동하지 않음

**해결:**
1. `MEDIA_SERVICE_URL` 확인
2. Media Service 직접 접속 테스트
3. Media Service 로그 확인

### 데이터베이스 연결 실패

**원인:**
- `DATABASE_URL` 환경 변수 누락
- PostgreSQL 서비스 연결 안 됨

**해결:**
1. Media Service의 환경 변수 확인
2. `DATABASE_URL=${{Postgres.DATABASE_URL}}` 설정
3. PostgreSQL 서비스가 Railway에 연결되어 있는지 확인

## 📝 빠른 확인 스크립트

PowerShell에서 실행:

```powershell
# Media Service 직접 확인
$mediaUrl = "https://your-media-service.railway.app"
Write-Host "Media Service Health:"
Invoke-WebRequest -Uri "$mediaUrl/actuator/health" -UseBasicParsing
Write-Host "`nMedia Service API:"
Invoke-WebRequest -Uri "$mediaUrl/api/v1/videos" -UseBasicParsing

# Gateway를 통한 확인
$gatewayUrl = "https://your-gateway.railway.app"
Write-Host "`nGateway를 통한 비디오 목록:"
Invoke-WebRequest -Uri "$gatewayUrl/api/v1/videos" -UseBasicParsing
```

## ✅ 정상 작동 확인

모든 것이 정상이면:
- Media Service Health: `{"status":"UP"}`
- Media Service API: `{"content":[],"totalElements":0,...}`
- Gateway API: `{"content":[],"totalElements":0,...}`

**데이터가 없어도 빈 배열이 반환되면 정상입니다!**
