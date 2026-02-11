# Audition Platform

온라인 오디션 플랫폼 — 기획사와 지망생을 연결하는 웹 애플리케이션

## 아키텍처

```
audition-platform/
├── backend/              # 단일 Spring Boot 백엔드 (모놀리스)
├── frontend/
│   └── web/              # Next.js 웹 애플리케이션
└── docs/                 # 문서 (참고/아카이브 포함)
```

- **Backend:** 단일 JAR, Flyway SSOT, Postgres. Railway 배포 시 Root = `backend`.
- **Frontend:** Next.js. Railway 배포 시 Root = `frontend/web`.
- 상세 구조는 `docs/REPO_STRUCTURE.md` 참고.

## 기술 스택

### Backend
- Spring Boot 3.2+, Java 17
- Spring Data JPA, Spring Security (JWT)
- PostgreSQL, Flyway

### Frontend
- Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query

## 로컬 개발

### 사전 요구사항
- Java 17+, Node.js 18+, Maven, PostgreSQL

### 백엔드
```bash
cd backend
./mvnw spring-boot:run
```
(Postgres URL 등은 `backend/src/main/resources/application.yml` 또는 환경 변수로 설정)

### 프론트엔드
```bash
cd frontend/web
npm install
npm run dev
```

배포 절차는 `README_DEPLOY.md` 및 `docs/RAILWAY_RESET_RUNBOOK.md` 참고.
