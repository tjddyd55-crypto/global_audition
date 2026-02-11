# Gateway Service Railway 배포 가이드

## 사전 준비

✅ Database (audition-db) - 배포 완료
✅ User Service - 배포 완료 (`https://user-service-production-7ba1.up.railway.app`)
✅ Audition Service - 배포 완료 (`https://audition-service-production.up.railway.app`)
✅ Media Service - 배포 완료 (`https://media-service-production-dff0.up.railway.app`)

## Gateway Service 배포 단계

### 1. Railway에서 서비스 생성

1. Railway 대시보드 접속
2. 프로젝트 선택 (다른 서비스들이 있는 프로젝트)
3. "+ New" → "GitHub Repo" 선택 (또는 Railway CLI 사용)
4. `backend/services/gateway` 디렉토리 선택

### 2. 환경 변수 설정 (중요)

Railway 대시보드에서 `gateway` → "Variables" 탭에서 다음 변수들을 설정:

#### 필수 환경 변수

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=production

# 서비스 URL 설정 (다른 서비스들의 Public URL)
USER_SERVICE_URL=https://user-service-production-7ba1.up.railway.app
AUDITION_SERVICE_URL=https://audition-service-production.up.railway.app
MEDIA_SERVICE_URL=https://media-service-production-dff0.up.railway.app
```

#### Railway 자동 설정

- `PORT` - Railway가 자동으로 설정합니다

> **중요**: 모든 서비스 URL은 HTTPS를 사용해야 합니다. Railway의 Public URL은 기본적으로 HTTPS를 지원합니다.

### 3. 서비스 URL 확인 방법

각 서비스의 Public URL은 Railway 대시보드에서 확인할 수 있습니다:

1. **User Service**: `user-service` → "Settings" → "Networking" → Public URL
2. **Audition Service**: `audition-service` → "Settings" → "Networking" → Public URL
3. **Media Service**: `media-service` → "Settings" → "Networking" → Public URL

### 4. 배포 방법

#### 방법 1: Railway CLI 사용

```bash
cd backend/services/gateway
railway link  # 프로젝트 연결 (첫 배포 시)
railway up    # 배포
```

#### 방법 2: GitHub 자동 배포

1. Railway 대시보드에서 서비스 설정
2. "Settings" → "GitHub" 탭에서 저장소 연결
3. "Deploy" → "Configure Build"에서:
   - Root Directory: `backend/services/gateway`
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/gateway-1.0.0-SNAPSHOT.jar`
4. 자동으로 배포 시작

### 5. 배포 확인

#### Health Check

배포가 완료되면 (보통 2-3분 소요) 다음 URL로 확인:

```
https://[gateway-url]/actuator/health
```

정상 응답 예시:
```json
{
  "status": "UP",
  "components": {
    "ping": {
      "status": "UP"
    }
  }
}
```

#### Gateway Routes 확인

```
https://[gateway-url]/actuator/gateway/routes
```

이 엔드포인트로 Gateway가 인식한 모든 라우트를 확인할 수 있습니다.

#### API 엔드포인트 테스트

Gateway를 통한 API 호출 테스트:

```bash
# User Service API (Gateway를 통한 호출)
curl https://[gateway-url]/api/v1/auth/register

# Audition Service API
curl https://[gateway-url]/api/v1/auditions

# Media Service API
curl https://[gateway-url]/api/v1/videos
```

### 6. Gateway 라우팅 설정

Gateway는 다음 경로로 각 서비스를 라우팅합니다:

- `/api/v1/auth/**` → User Service
- `/api/v1/auditions/**` → Audition Service
- `/api/v1/applications/**` → Audition Service
- `/api/v1/offers/**` → Audition Service
- `/api/v1/videos/**` → Media Service

### 7. 문제 해결

#### 503 Service Unavailable

- 다른 서비스들의 URL이 정확한지 확인
- 다른 서비스들이 모두 "Online" 상태인지 확인
- HTTPS URL을 사용하고 있는지 확인 (HTTP는 사용하지 마세요)

#### Gateway Routes가 비어있음

- 환경 변수가 정확히 설정되었는지 확인
- Railway 로그에서 Gateway 초기화 메시지 확인
- `/actuator/gateway/routes` 엔드포인트로 라우트 확인

#### CORS 오류

- Gateway의 CORS 설정이 `application-production.yml`에 있음
- `CorsConfig.java`에서 CORS 설정 확인

#### Actuator 접근 불가

- Gateway는 Security가 없으므로 기본적으로 접근 가능해야 합니다
- 문제가 발생하면 Railway 로그 확인

### 8. 배포 순서 체크리스트

Gateway 배포 전 확인:

- [ ] User Service 배포 완료 및 Public URL 확인
- [ ] Audition Service 배포 완료 및 Public URL 확인
- [ ] Media Service 배포 완료 및 Public URL 확인
- [ ] 모든 서비스가 "Online" 상태
- [ ] 모든 서비스의 Health Check 통과

### 9. 다음 단계

Gateway Service 배포가 완료되면:

1. **프론트엔드 설정**: Gateway의 Public URL을 API Base URL로 사용
2. **API 테스트**: Gateway를 통한 모든 API 엔드포인트 테스트
3. **모니터링**: Gateway 로그 및 메트릭 확인

## 환경 변수 체크리스트

배포 전 확인사항:

- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `USER_SERVICE_URL` (HTTPS URL)
- [ ] `AUDITION_SERVICE_URL` (HTTPS URL)
- [ ] `MEDIA_SERVICE_URL` (HTTPS URL)

## Public URL 확인

배포 완료 후:

1. Railway 대시보드에서 `gateway` 클릭
2. "Settings" → "Networking"에서 Public URL 확인
3. 프론트엔드의 API Base URL로 사용

## 특징

- **Spring Cloud Gateway**: WebFlux 기반의 리액티브 Gateway
- **Security 없음**: Gateway는 단순 라우팅만 수행 (각 서비스에서 인증 처리)
- **CORS 지원**: 모든 Origin 허용 (프로덕션에서는 제한 권장)
- **Actuator**: Health Check 및 Gateway Routes 확인 가능
