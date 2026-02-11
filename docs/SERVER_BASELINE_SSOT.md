# 서버 기준선 (SSOT) - Global Audition Platform

## 이 문서의 목적 (중요)

이 문서는 Global Audition Platform의 **서버 기준선(SSOT)** 이다.

- 로컬 환경은 참고용이다.
- MVP 검증 기준은 Railway 프로덕션 서버이다.
- 서버 설정이 코드보다 우선한다.
- Cursor는 이 문서를 기준으로만 코드를 수정한다.

❗ **이 문서와 충돌하는 설계/코드는 무조건 수정 대상이다.**

## 1. 공식 서버 구성 (변경 금지)

### ✅ 활성 서버 (ONLY)
- **frontend-web**
- **api-backend**
- **media-service**
- **postgres-main**

이 네 개가 유일한 공식 서버 구성이다.

### ❌ 비공식 / 폐기 대상 서버

아래 이름의 서버는 더 이상 기준이 아니다.

- **audition-service** (단독)
- **user-service** (단독)
- **gateway** (단독)
- **audition-db**

존재하더라도 비활성 또는 삭제 대상. 코드 기준에서 완전히 배제한다.

## 2. 서버 역할 정의 (SSOT)

### 2.1 frontend-web
- Next.js 기반 웹 프론트엔드
- UI / UX 전담
- 비즈니스 로직 없음
- API 직접 호출은 **api-backend만** 허용

### 2.2 api-backend (세미 통합 백엔드)
- 논리적으로 분리된 도메인을 하나의 배포 단위로 운영
- 포함 모듈:
  - **gateway** (라우팅/인증)
  - **user-domain** (User Service)
  - **audition-domain** (Audition Service)
- ❗ 운영상 하나의 서버
- ❗ 포트/배포 분리 금지

### 2.3 media-service
- 영상/파일 업로드 및 조회
- Object Storage 연동
- 트래픽/용량 분리 목적
- 끝까지 독립 유지

### 2.4 postgres-main
- 단일 PostgreSQL 인스턴스
- 논리적 스키마 분리:
  - `user_schema`
  - `audition_schema`
  - `media_schema`

## 3. 네트워크 통신 원칙

- ❌ 포트 번호 기반 통신
- ❌ localhost / 127.0.0.1
- ❌ 서비스명 직접 호출
- ✅ **도메인 기반 통신 ONLY**

통신 경로:
- `frontend-web` → `api-backend`
- `api-backend` → `media-service`
- 모든 서비스 → `postgres-main`

## 4. 서버별 루트 디렉토리 구조 & 빌드 설정

### 4.1 frontend-web
- **Root Directory**: `frontend/web`
- **Build/Start 설정 SSOT**: `frontend/web/railway.json` (Railway UI가 아님)
- **Build Command**: `npm install && npm run build` (railway.json에서 관리)
- **Start Command**: `npm start` (railway.json에서 관리)
- **Required ENV**:
  - `NODE_ENV=production`
  - `NEXT_PUBLIC_API_BASE_URL=https://<api-backend-domain>`
- ❗ gateway / audition-service URL 사용 금지
- ❗ **Railway UI에서 Build/Start 설정 수정 금지 - 반드시 railway.json만 수정**

### 4.2 api-backend
- **Railway 서비스 이름**: `api-backend` (실제 폴더명이 아님)
- **Root Directory**: `backend` (또는 repo-root) - **반드시 `backend`로 설정**
- **엔트리 포인트**: `gateway` (backend/services/gateway)
- **Build Command**: `./gradlew clean build` (backend에서 실행)
- **Start Command**: `java -jar services/gateway/build/libs/gateway.jar` (gateway가 엔트리 포인트)
- **Required ENV**:
  - `SPRING_PROFILES_ACTIVE=production`
  - `DATABASE_URL=postgres://<postgres-main>`
  - `JWT_SECRET=********`
- ❗ 개별 서비스 포트 설정 금지
- ❗ application.yml에서 localhost 참조 금지
- ❗ **폴더 구조 변경 금지** (gateway, user-service, audition-service는 논리적 모듈로만 분리)

#### 빌드 오류 해결
- **`./gradlew not found` 오류 발생 시**: Root Directory 설정 문제
  - gradlew는 `backend/`에 존재
  - Root Directory는 반드시 `backend`로 설정
  - ❗ gradlew를 이동/복사/재생성하지 않음

### 4.3 media-service
- **Root Directory**: `backend` (반드시 `backend`로 설정)
- **실행 대상 모듈**: `media-service` (backend/services/media-service)
- **Build Command**: `mvn clean package -pl services/media-service -am -DskipTests` (backend에서 실행)
- **Start Command**: `java -jar services/media-service/target/media-service-*.jar`
- **Required ENV**:
  - `SPRING_PROFILES_ACTIVE=production`
  - `DATABASE_URL=postgres://<postgres-main>`
  - `STORAGE_TYPE=s3 | gcs`
  - `STORAGE_BUCKET=...`
  - `STORAGE_ACCESS_KEY=...`
  - `STORAGE_SECRET_KEY=...`

### 4.4 postgres-main
- Railway Managed PostgreSQL
- 단일 DB
- Volume 유지
- ❗ Flyway Migration은 각 서비스별 디렉터리 기준
- ❗ Migration 충돌 시 서버 기준 우선

## 5. 환경 변수 관리 원칙

- ENV는 Railway Dashboard가 SSOT
- `.env` 파일은 로컬 참고용
- Cursor는 ENV 이름을 새로 만들지 않는다

## 6. Cursor 작업 강제 규칙 (매우 중요)

### 🧠 Cursor Server Alignment Rule
모든 구현은 Railway 서버 기준선에 맞춘다.

- 서버 구조는 변경하지 않는다
- 서버 이름은 `frontend-web` / `api-backend` / `media-service` / `postgres-main` 만 사용한다
- **localhost 기반 코드는 금지한다**
- 서버와 코드가 충돌하면 코드를 수정한다

**이 문서를 기준으로 작업한다.**
