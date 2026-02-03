# 프로덕션 서버 구조 (SSOT)

## 서버 구성
- **api-backend** (Railway 서비스 이름): gateway + user + audition 통합 배포
  - Root Directory: `backend` (또는 repo-root)
  - 엔트리 포인트: `gateway` (backend/services/gateway)
  - ❗ 실제 폴더명 `api-backend`는 존재하지 않음
- **media-service**: 독립 서비스
- **postgres-main**: 통합 데이터베이스

## 아키텍처 원칙
1. **User/Audition은 논리적 모듈로만 분리**
   - 코드 구조는 유지 (패키지 분리)
   - 배포/포트/DB는 통합 구조

2. **서비스 간 통신**
   - api-backend 내부: 직접 서비스 호출 (HTTP 호출 불필요)
   - api-backend ↔ media-service: HTTP 호출 (별도 서비스)

3. **DB 스키마**
   - postgres-main: 모든 테이블 통합
   - User/Audition 스키마는 논리적으로 분리 (네이밍으로 구분)

4. **환경 변수**
   - 서버 설정을 SSOT로 삼음
   - 코드는 서버 설정에 맞춤

## 변경 사항
- UserServiceClient → 직접 InternalUserService 주입
- PointServiceClient → 직접 PointService 주입
- DB 연결: 통합 DB 사용
- 포트: api-backend 하나만 사용
