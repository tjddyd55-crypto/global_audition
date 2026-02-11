# 시작 가이드

## 사전 요구사항

- Java 17+
- Node.js 18+
- PostgreSQL (로컬 또는 Railway)
- Maven 3.8+

## 초기 설정

### 1. 데이터베이스 설정

```bash
# Postgres 로컬 실행 또는 Railway Postgres 사용
# Backend는 Flyway로 스키마 자동 적용 (V1__init.sql)

# 백엔드 실행 (단일 앱)
cd backend
./mvnw spring-boot:run
```

### 2. 프론트엔드 실행

```bash
cd frontend/web
npm install
npm run dev
```

## API 문서

- Backend (단일): http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/api/health
- Version: http://localhost:8080/api/version
