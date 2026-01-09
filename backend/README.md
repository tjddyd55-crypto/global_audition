# Backend Services

백엔드 마이크로서비스 아키텍처

## 서비스 구조

### 1. Audition Service (포트: 8081)
오디션 관리 서비스
- 오디션 CRUD
- 지원 관리
- 심사 프로세스

### 2. User Service (포트: 8082)
사용자 관리 서비스
- 사용자 인증/인가
- 프로필 관리
- 권한 관리

### 3. Media Service (포트: 8083)
미디어 관리 서비스
- 비디오 업로드/스트리밍
- 이미지 관리
- CDN 연동

### 4. Gateway (포트: 8080)
API Gateway
- 라우팅
- 인증
- Rate Limiting

## 공통 설정

### 데이터베이스
- PostgreSQL 16
- 포트: 5432

### 캐시
- Redis 7
- 포트: 6379

## 개발 환경 설정

```bash
# Docker Compose로 인프라 실행
cd ../../
docker-compose up -d

# 각 서비스 실행
cd audition-service
./mvnw spring-boot:run
```
