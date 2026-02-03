# 프로덕션 아키텍처 (최종)

## 서버 구성 (SSOT)
- **api-backend** (Railway 서비스 이름): gateway + user + audition 통합 배포
  - Root Directory: `backend` (또는 repo-root)
  - 엔트리 포인트: `gateway` (backend/services/gateway)
  - ❗ 실제 폴더명 `api-backend`는 존재하지 않음
- **media-service**: 독립 서비스
- **postgres-main**: 통합 데이터베이스

## 코드 구조 원칙

### 1. 논리적 모듈 분리
- User/Audition은 **논리적 모듈로만 분리**
- 코드 패키지 구조는 유지
- 배포/포트/DB는 통합 구조

### 2. 서비스 간 통신
- **api-backend 내부**: localhost로 HTTP 호출 (같은 서버)
  - UserServiceClient: `http://localhost:${PORT}`
  - PointServiceClient: `http://localhost:${PORT}`
- **api-backend ↔ media-service**: HTTP 호출 (별도 서비스)
  - Gateway 라우팅: `http://media-service:${PORT}`

### 3. DB 스키마
- **postgres-main**: 모든 테이블 통합
- User/Audition 스키마는 논리적으로 분리 (네이밍으로 구분)
- 같은 DB 인스턴스 사용

### 4. 환경 변수
- **서버 설정을 SSOT로 삼음**
- 코드는 서버 설정에 맞춤
- `user.service.url=http://localhost:${PORT}` (통합 구조)

## 변경 사항 요약

### 코드 변경
1. **UserServiceClient**: `user.service.url` 기본값 변경
   - 기존: `http://localhost:8082`
   - 변경: `http://localhost:${server.port:8080}`

2. **PointServiceClient**: 동일하게 변경

3. **Gateway 라우팅**: 프로덕션 구조에 맞게 수정
   - User/Audition: `http://localhost:${server.port:8080}` (같은 서버)
   - Media: `http://media-service:${PORT}` (별도 서비스)

### 설정 변경
1. **application-production.yml**: 
   - `user.service.url` 추가
   - DB URL을 `postgres-main`으로 통일

2. **DB 연결**: 통합 DB 사용
   - 모든 서비스가 `postgres-main` 사용

## 배포 구조

### api-backend (Railway 서비스 이름)
```
backend/ (Root Directory)
  └── services/
      ├── gateway/ (엔트리 포인트, 포트: ${PORT})
      ├── user-service/ (논리적 모듈)
      └── audition-service/ (논리적 모듈)
```

**중요**: 
- ❗ `api-backend` 폴더는 존재하지 않음 (Railway 서비스 이름일 뿐)
- ✅ Root Directory는 `backend`
- ✅ gateway가 엔트리 포인트

### media-service
```
독립 서비스 (포트: ${PORT:8083})
```

## 주의사항

1. **로컬 개발**: 여전히 별도 서비스로 실행 가능
2. **프로덕션**: api-backend로 통합 배포 필요
3. **환경 변수**: 서버 설정에 맞춰 설정
4. **DB 스키마**: 통합 DB 사용 (postgres-main)
