# Audition Service Railway 배포 가이드

## 사전 준비

✅ Database (audition-db) - 배포 완료
✅ User Service - 배포 완료 및 Health Check 정상 작동

## Audition Service 배포 단계

### 1. Railway에서 서비스 생성

1. Railway 대시보드 접속
2. 프로젝트 선택
3. "+ New" → "GitHub Repo" 선택 (또는 Railway CLI 사용)
4. `backend/services/audition-service` 디렉토리 선택

### 2. 환경 변수 설정

Railway 대시보드에서 `audition-service` → "Variables" 탭에서 다음 변수들을 설정:

#### 필수 환경 변수

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=production

# Database 연결 (기존 Database와 동일)
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres.railway.internal:5432/railway
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=[Database 비밀번호 - User Service와 동일]

# JWT Secret (User Service와 동일하게 설정)
JWT_SECRET=[User Service에서 사용하는 동일한 JWT_SECRET 값]
JWT_EXPIRATION=86400000
```

#### 선택적 환경 변수 (Redis - 선택 사항)

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

> **참고**: Redis는 캐시용으로 선택 사항입니다. 설정하지 않으면 localhost로 기본값이 사용되지만, Railway에서 별도 Redis 서비스를 추가해야 합니다.

#### Railway 자동 설정

- `PORT` - Railway가 자동으로 설정합니다

### 3. Database 비밀번호 확인 방법

1. Railway 대시보드에서 Database (audition-db) 클릭
2. "Variables" 탭에서 `PGPASSWORD` 또는 `POSTGRES_PASSWORD` 확인
3. 또는 Database Connection String에서 비밀번호 확인

### 4. JWT_SECRET 확인 방법

1. Railway 대시보드에서 User Service 클릭
2. "Variables" 탭에서 `JWT_SECRET` 값 복사
3. Audition Service의 `JWT_SECRET`에 동일한 값 설정

> **중요**: User Service와 Audition Service가 같은 JWT_SECRET을 사용해야 JWT 토큰 검증이 정상 작동합니다.

### 5. 배포 방법

#### 방법 1: Railway CLI 사용

```bash
cd backend/services/audition-service
railway link  # 프로젝트 연결 (첫 배포 시)
railway up    # 배포
```

#### 방법 2: GitHub 자동 배포

1. Railway 대시보드에서 서비스 설정
2. "Settings" → "GitHub" 탭에서 저장소 연결
3. "Deploy" → "Configure Build"에서:
   - Root Directory: `backend/services/audition-service`
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/audition-service-1.0.0-SNAPSHOT.jar`
4. 자동으로 배포 시작

### 6. 배포 확인

#### Health Check

배포가 완료되면 (보통 2-3분 소요) 다음 URL로 확인:

```
https://[audition-service-url]/actuator/health
```

정상 응답 예시:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

#### Swagger UI

```
https://[audition-service-url]/swagger-ui.html
```

### 7. 문제 해결

#### 403 Forbidden on /actuator/health

- SecurityConfig에 Actuator 전용 SecurityFilterChain이 추가되어 있는지 확인
- 최신 코드가 배포되었는지 확인

#### Database Connection Error

- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` 설정 확인
- Database 서비스가 "Online" 상태인지 확인
- Railway 내부 네트워크 주소 `postgres.railway.internal:5432` 사용 확인

#### JWT Token Validation Error

- `JWT_SECRET`이 User Service와 동일한지 확인
- `JWT_EXPIRATION`이 동일한지 확인

#### Redis Connection Error (선택 사항)

- Redis 서비스를 Railway에 추가하지 않았다면:
  - `REDIS_HOST=localhost`로 설정 (기본값)
  - Redis 기능이 제한될 수 있지만 서비스는 정상 작동
- Redis가 필요한 경우 Railway에서 Redis 서비스 추가 후 환경 변수 설정

### 8. 다음 단계

Audition Service 배포가 완료되면:

1. **Media Service 배포** (Database 사용)
2. **Gateway Service 배포** (모든 서비스 URL 필요)
   - Gateway에서 Audition Service URL을 `AUDITION_SERVICE_URL`로 설정

## 환경 변수 체크리스트

배포 전 확인사항:

- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `SPRING_DATASOURCE_URL` (Railway 내부 네트워크 주소)
- [ ] `SPRING_DATASOURCE_USERNAME` (Database 사용자명)
- [ ] `SPRING_DATASOURCE_PASSWORD` (Database 비밀번호)
- [ ] `JWT_SECRET` (User Service와 동일)
- [ ] `JWT_EXPIRATION=86400000`
- [ ] `REDIS_HOST` (선택 사항)
- [ ] `REDIS_PORT` (선택 사항)

## Public URL 확인

배포 완료 후:

1. Railway 대시보드에서 `audition-service` 클릭
2. "Settings" → "Networking"에서 Public URL 확인
3. Gateway Service의 `AUDITION_SERVICE_URL`에 설정
