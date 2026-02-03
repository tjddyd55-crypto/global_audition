# Audition Platform

온라인 오디션 플랫폼 - 기획사와 지망생을 연결하는 모던 웹/모바일 애플리케이션

## 🏗️ 아키텍처

```
audition-platform/
├── backend/              # 백엔드 마이크로서비스
│   ├── services/
│   │   ├── audition-service/ # 오디션 관리 서비스 (포트: 8081)
│   │   ├── user-service/    # 사용자 관리 서비스 (포트: 8082)
│   │   ├── media-service/   # 미디어(비디오) 관리 서비스 (포트: 8083)
│   │   └── gateway/         # API Gateway (포트: 8080)
│   └── libs/                # 공통 모듈(계약/런타임)
├── frontend/            # 프론트엔드
│   └── web/             # Next.js 14 웹 애플리케이션
├── mobile/              # 모바일 앱
│   └── app/             # React Native 애플리케이션
└── docs/                # 문서
```

## 🚀 기술 스택

### Backend
- Spring Boot 3.2+
- Java 17+
- Spring Data JPA
- Spring Security (JWT)
- PostgreSQL
- Redis
- Docker & Kubernetes

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- Zustand

### Mobile
- React Native 0.72+
- TypeScript
- React Navigation

## 📋 주요 기능

- ✅ 오디션 생성 및 관리 (1차, 2차, 3차 심사, 최종 합격)
- ✅ 지망생 프로필 및 영상 관리
- ✅ 기획사의 오디션 제안 기능
- ✅ 사용자 인증/인가 (JWT)
- ✅ 비디오 콘텐츠 관리
- ✅ 모바일 우선 디자인

## 🛠️ 개발 환경 설정

### 사전 요구사항
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7
- Maven 3.8+

### 로컬 개발 시작

```bash
# 1. Docker Compose로 인프라 실행
docker-compose up -d

# 2. 데이터베이스 스키마 생성
psql -h localhost -U audition_user -d audition_db -f backend/services/audition-service/src/main/resources/db/schema.sql

# 3. 백엔드 서비스 실행
cd backend/services/audition-service
./mvnw spring-boot:run

# 4. 프론트엔드 실행
cd frontend/web
npm install
npm run dev
```

## 📝 개발 가이드

각 서비스별 README 참조:
- [Backend Services](./backend/README.md)
- [Frontend](./frontend/web/README.md)
- [Getting Started](./docs/GETTING_STARTED.md)
- [Testing Guide](./docs/TESTING.md)

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend/services/audition-service
./mvnw test
```

### 프론트엔드 테스트
```bash
cd frontend/web
npm test
```

## 🚀 배포 (Production)

### Railway 배포

모든 서비스가 Railway에 배포되어 있습니다.

**프로덕션 접속 주소:**
- **프론트엔드 (메인 사이트):** https://frontend-web-production-b917.up.railway.app ✅
- **API Gateway:** https://gateway-production-72d6.up.railway.app
- **User Service:** https://user-service-production-7ba1.up.railway.app
- **Audition Service:** https://audition-service-production.up.railway.app
- **Media Service:** https://media-service-production-dff0.up.railway.app

자세한 배포 가이드는 [배포 문서](./docs/FRONTEND_RAILWAY_DEPLOY.md)를 참조하세요.

## 📄 라이선스

MIT License
