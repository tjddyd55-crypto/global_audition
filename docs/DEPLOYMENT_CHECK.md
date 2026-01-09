# 배포 확인 가이드

Railway에 배포한 서비스들이 정상적으로 작동하는지 확인하는 방법입니다.

## 1. Railway 대시보드에서 확인

### 각 서비스 상태 확인
1. Railway 대시보드 접속
2. 각 서비스의 **Deployments** 탭 확인
   - ✅ **Deployed**: 정상 배포됨
   - ⏳ **Building**: 빌드 중
   - ❌ **Failed**: 배포 실패

### 로그 확인
각 서비스의 **Logs** 탭에서:
- 에러 메시지 확인
- "Started ... in ... seconds" 메시지 확인 (정상 시작)
- 데이터베이스 연결 성공 메시지 확인

## 2. Public URL 확인

각 서비스의 **Settings** → **Networking**에서:
- **Public URL** 확인 및 복사
- Gateway의 Public URL을 메모해 두세요 (프론트엔드에서 사용)

## 3. 헬스 체크

### 브라우저에서 확인

각 서비스의 Public URL에 `/actuator/health` 추가:

```
https://your-user-service.railway.app/actuator/health
https://your-audition-service.railway.app/actuator/health
https://your-media-service.railway.app/actuator/health
https://your-gateway.railway.app/actuator/health
```

**예상 응답:**
```json
{
  "status": "UP"
}
```

### 스크립트로 확인

PowerShell에서:
```powershell
.\scripts\check-deployment.ps1 -GatewayUrl "https://your-gateway.railway.app"
```

또는 Batch 파일:
```cmd
scripts\check-deployment.bat "https://your-gateway.railway.app"
```

## 4. API 엔드포인트 테스트

### Gateway를 통한 테스트

Gateway의 Public URL을 사용하여 각 서비스에 접근:

#### 1. User Service - 회원가입 테스트
```bash
curl -X POST https://your-gateway.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234",
    "name": "테스트 사용자"
  }'
```

#### 2. User Service - 로그인 테스트
```bash
curl -X POST https://your-gateway.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234"
  }'
```

#### 3. Audition Service - 오디션 목록 조회
```bash
curl https://your-gateway.railway.app/api/v1/auditions
```

#### 4. Media Service - 비디오 목록 조회
```bash
curl https://your-gateway.railway.app/api/v1/videos
```

**참고:** Not Found 오류가 발생하면 [TROUBLESHOOTING_NOT_FOUND.md](TROUBLESHOOTING_NOT_FOUND.md) 참고

## 5. 일반적인 문제 해결

### 문제 1: 서비스가 시작되지 않음
**원인:**
- 환경 변수 누락
- 데이터베이스 연결 실패
- 포트 충돌

**해결:**
1. Railway 로그 확인
2. 환경 변수 확인 (Settings → Variables)
3. 데이터베이스 연결 정보 확인

### 문제 2: 502 Bad Gateway
**원인:**
- Gateway가 다른 서비스에 연결할 수 없음
- 서비스 URL이 잘못 설정됨

**해결:**
1. Gateway의 환경 변수 확인:
   - `USER_SERVICE_URL`
   - `AUDITION_SERVICE_URL`
   - `MEDIA_SERVICE_URL`
2. 각 서비스의 Public URL이 올바른지 확인

### 문제 3: 데이터베이스 연결 실패
**원인:**
- `SPRING_DATASOURCE_URL` 환경 변수 누락
- 데이터베이스 자격 증명 오류

**해결:**
1. Railway에서 PostgreSQL 서비스의 **Variables** 탭 확인
2. `DATABASE_URL` 또는 개별 변수 확인:
   - `SPRING_DATASOURCE_URL`
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`

### 문제 4: CORS 오류
**원인:**
- 프론트엔드 도메인이 Gateway의 CORS 설정에 포함되지 않음

**해결:**
Gateway의 `application-production.yml`에서 `allowedOrigins`에 프론트엔드 URL 추가

## 6. 환경 변수 체크리스트

### User Service
- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `SPRING_DATASOURCE_URL` (PostgreSQL 연결 URL)
- [ ] `SPRING_DATASOURCE_USERNAME`
- [ ] `SPRING_DATASOURCE_PASSWORD`
- [ ] `JWT_SECRET` (최소 32자 랜덤 문자열)
- [ ] `JWT_EXPIRATION=86400000`
- [ ] `PORT` (Railway가 자동 설정)

### Audition Service
- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `SPRING_DATASOURCE_URL`
- [ ] `SPRING_DATASOURCE_USERNAME`
- [ ] `SPRING_DATASOURCE_PASSWORD`
- [ ] `REDIS_HOST` (Redis 사용 시)
- [ ] `REDIS_PORT` (Redis 사용 시)
- [ ] `PORT` (Railway가 자동 설정)

### Media Service
- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `SPRING_DATASOURCE_URL`
- [ ] `SPRING_DATASOURCE_USERNAME`
- [ ] `SPRING_DATASOURCE_PASSWORD`
- [ ] `PORT` (Railway가 자동 설정)

### Gateway
- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `USER_SERVICE_URL` (User Service의 Public URL)
- [ ] `AUDITION_SERVICE_URL` (Audition Service의 Public URL)
- [ ] `MEDIA_SERVICE_URL` (Media Service의 Public URL)
- [ ] `PORT` (Railway가 자동 설정)

## 7. 성공 확인

모든 서비스가 정상적으로 작동하면:
- ✅ Gateway Health Check: `{"status":"UP"}`
- ✅ 각 서비스 Health Check: `{"status":"UP"}`
- ✅ API 요청이 정상적으로 응답
- ✅ Railway 로그에 에러 없음

## 8. 다음 단계

배포 확인이 완료되면:
1. 프론트엔드 배포 (Vercel 등)
2. 프론트엔드에서 Gateway URL 설정
3. 전체 시스템 통합 테스트
