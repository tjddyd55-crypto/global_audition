# 시작 가이드

## 사전 요구사항

- Java 17+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7
- Maven 3.8+

## 초기 설정

### 1. 데이터베이스 설정

```bash
# Docker Compose로 인프라 실행
docker-compose up -d

# 데이터베이스 스키마 생성
psql -h localhost -U audition_user -d audition_db -f backend/audition-service/src/main/resources/db/schema.sql
```

### 2. 백엔드 서비스 실행

```bash
# Audition Service
cd backend/audition-service
./mvnw spring-boot:run

# User Service (새 터미널)
cd backend/user-service
./mvnw spring-boot:run

# Media Service (새 터미널)
cd backend/media-service
./mvnw spring-boot:run
```

### 3. 프론트엔드 실행

```bash
cd frontend/web
npm install
npm run dev
```

## API 문서

- Audition Service: http://localhost:8081/swagger-ui.html
- User Service: http://localhost:8082/swagger-ui.html
- Media Service: http://localhost:8083/swagger-ui.html

## 주요 엔드포인트

### 인증 (User Service - 8082)
- POST `/api/v1/auth/register` - 회원가입
- POST `/api/v1/auth/login` - 로그인

### 오디션 (Audition Service - 8081)
- GET `/api/v1/auditions` - 오디션 목록
- GET `/api/v1/auditions/{id}` - 오디션 상세
- POST `/api/v1/applications` - 오디션 지원
- POST `/api/v1/offers` - 오디션 제안

### 비디오 (Media Service - 8083)
- GET `/api/v1/videos` - 비디오 목록
- POST `/api/v1/videos` - 비디오 업로드
