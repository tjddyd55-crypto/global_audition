# Media Service Railway 배포 가이드

## 사전 준비

✅ Database (audition-db) - 배포 완료
✅ User Service - 배포 완료
✅ Audition Service - 배포 완료

## Media Service 배포 단계

### 1. Railway에서 서비스 생성

1. Railway 대시보드 접속
2. 프로젝트 선택
3. "+ New" → "GitHub Repo" 선택 (또는 Railway CLI 사용)
4. `backend/media-service` 디렉토리 선택

### 2. 환경 변수 설정

Railway 대시보드에서 `media-service` → "Variables" 탭에서 다음 변수들을 설정:

#### 필수 환경 변수

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=production

# Database 연결 (기존 Database와 동일)
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres.railway.internal:5432/railway
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=[Database 비밀번호 - 다른 서비스와 동일]
```

#### Railway 자동 설정

- `PORT` - Railway가 자동으로 설정합니다

### 3. Database 비밀번호 확인 방법

1. Railway 대시보드에서 Database (audition-db) 클릭
2. "Variables" 탭에서 `PGPASSWORD` 또는 `POSTGRES_PASSWORD` 확인
3. 또는 다른 서비스(User Service, Audition Service)에서 `SPRING_DATASOURCE_PASSWORD` 확인

### 4. 배포 방법

#### 방법 1: Railway CLI 사용

```bash
cd backend/media-service
railway link  # 프로젝트 연결 (첫 배포 시)
railway up    # 배포
```

#### 방법 2: GitHub 자동 배포

1. Railway 대시보드에서 서비스 설정
2. "Settings" → "GitHub" 탭에서 저장소 연결
3. "Deploy" → "Configure Build"에서:
   - Root Directory: `backend/media-service`
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/media-service-1.0.0-SNAPSHOT.jar`
4. 자동으로 배포 시작

### 5. 배포 확인

#### Health Check

배포가 완료되면 (보통 2-3분 소요) 다음 URL로 확인:

```
https://[media-service-url]/actuator/health
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
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

> **참고**: Media Service는 Security가 없으므로 Actuator는 기본적으로 접근 가능합니다.

#### Swagger UI

```
https://[media-service-url]/swagger-ui.html
```

### 6. 문제 해결

#### Database Connection Error

- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` 설정 확인
- Database 서비스가 "Online" 상태인지 확인
- Railway 내부 네트워크 주소 `postgres.railway.internal:5432` 사용 확인

#### Actuator 접근 불가

- Media Service는 Security가 없으므로 기본적으로 접근 가능해야 합니다
- 문제가 발생하면 Railway 로그 확인

### 7. 다음 단계

Media Service 배포가 완료되면:

1. **Gateway Service 배포** (모든 서비스 URL 필요)
   - Gateway에서 Media Service URL을 `MEDIA_SERVICE_URL`로 설정
   - 현재까지 완료된 서비스 URL:
     - `USER_SERVICE_URL=https://user-service-production-7ba1.up.railway.app`
     - `AUDITION_SERVICE_URL=https://audition-service-production.up.railway.app`
     - `MEDIA_SERVICE_URL=https://media-service-xxx.up.railway.app`

## 환경 변수 체크리스트

배포 전 확인사항:

- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `SPRING_DATASOURCE_URL` (Railway 내부 네트워크 주소)
- [ ] `SPRING_DATASOURCE_USERNAME` (Database 사용자명)
- [ ] `SPRING_DATASOURCE_PASSWORD` (Database 비밀번호)

## Public URL 확인

배포 완료 후:

1. Railway 대시보드에서 `media-service` 클릭
2. "Settings" → "Networking"에서 Public URL 확인
3. Gateway Service의 `MEDIA_SERVICE_URL`에 설정

## 특징

- **Security 없음**: Media Service는 인증이 필요 없는 공개 API입니다
- **Actuator 접근**: Security가 없으므로 기본적으로 접근 가능
- **Database만 사용**: Redis나 다른 외부 서비스 없음
