# 프로덕션 서버 설정 (SSOT)

## 서버 구성
- **api-backend** (Railway 서비스 이름): gateway + user + audition 통합 배포
  - Root Directory: `backend` (또는 repo-root)
  - 엔트리 포인트: `gateway` (backend/services/gateway)
  - ❗ 실제 폴더명 `api-backend`는 존재하지 않음
- **media-service**: 독립 서비스
- **postgres-main**: 통합 데이터베이스

## 환경 변수 설정

### api-backend (Railway 서비스 이름, Root Directory: backend)
```yaml
# 포트
PORT: ${PORT}  # Railway/서버에서 설정

# DB 연결 (통합 DB)
DATABASE_PUBLIC_URL: jdbc:postgresql://postgres-main:5432/railway
SPRING_DATASOURCE_USERNAME: postgres
SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}

# JWT
JWT_SECRET: ${JWT_SECRET}
JWT_EXPIRATION: 86400000

# 내부 서비스 URL (통합 구조에서는 localhost)
user.service.url: http://localhost:${PORT}
```

### media-service
```yaml
# 포트
PORT: ${PORT:8083}

# DB 연결 (통합 DB)
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-main:5432/railway
SPRING_DATASOURCE_USERNAME: postgres
SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}

# JWT (api-backend와 동일)
JWT_SECRET: ${JWT_SECRET}
JWT_EXPIRATION: 86400000
```

## API Base URL

### api-backend
- **Base URL**: `http://api-backend:${PORT}`
- **경로**:
  - `/api/v1/auth/**` → User Service
  - `/api/v1/channels/**` → User Service
  - `/api/v1/auditions/**` → Audition Service
  - `/api/v1/applications/**` → Audition Service
  - `/internal/users/**` → User Service (내부 API)

### media-service
- **Base URL**: `http://media-service:${PORT}`
- **경로**:
  - `/api/v1/videos/**` → Media Service

## Gateway 라우팅 (api-backend 내부)

api-backend (Railway 서비스 이름)는 gateway + user + audition이 통합되어 있으므로:
- Gateway (backend/services/gateway)가 엔트리 포인트
- Gateway는 외부 요청을 받아 내부 라우팅
- User/Audition은 논리적 모듈로만 분리 (폴더 구조 유지)
- 같은 애플리케이션 컨텍스트에서 실행

## DB 스키마

### postgres-main (통합 DB)
- 모든 테이블 통합
- User 관련: `users`, `applicant_profiles`, `business_profiles`, `user_points`, `point_transactions` 등
- Audition 관련: `auditions`, `applications`, `audition_stages` 등
- Media 관련: `video_contents`, `video_feedback`, `video_comments` 등

## 변경 사항 요약

1. **UserServiceClient**: `user.service.url` 기본값을 `http://localhost:${server.port:8080}`로 변경
2. **PointServiceClient**: 동일하게 변경
3. **DB 연결**: 통합 DB 사용 (postgres-main)
4. **포트**: api-backend는 ${PORT} 사용
