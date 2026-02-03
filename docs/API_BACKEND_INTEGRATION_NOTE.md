# api-backend 통합 배포 주의사항

## 현재 상황

서버 기준선(SSOT)에 따르면:
- **api-backend**: gateway + user-domain + audition-domain이 하나의 배포 단위
- localhost/포트 기반 통신 금지
- api-backend 내부는 직접 서비스 주입 사용

## 코드 구조

현재 코드는 별도 모듈로 구성되어 있음:
- `user-service`: user-domain
- `audition-service`: audition-domain
- `gateway`: gateway

## 통합 배포 시 요구사항

### 옵션 1: 통합 애플리케이션 생성 (권장)
- `api-backend` 모듈 생성
- user-domain과 audition-domain을 같은 애플리케이션 컨텍스트에 통합
- 같은 패키지 구조로 통합하거나, 모듈 의존성으로 통합

### 옵션 2: 현재 구조 유지 + 통합 배포
- 현재 모듈 구조 유지
- 통합 배포 시 같은 애플리케이션 컨텍스트에서 실행
- UserServiceClient, PointServiceClient는 직접 서비스 주입 사용

## 현재 코드 변경 사항

### UserServiceClient
- HTTP 호출 → 직접 서비스 주입 (`InternalUserService`, `UserRoleValidator`)
- **주의**: 통합 배포 시에만 동작 (별도 모듈로 실행 시 컴파일 오류)

### PointServiceClient
- HTTP 호출 → 직접 서비스 주입 (`PointService`)
- **주의**: 통합 배포 시에만 동작 (별도 모듈로 실행 시 컴파일 오류)

### Gateway 라우팅
- localhost 기반 라우팅 제거
- api-backend 내부 경로는 직접 컨트롤러로 처리
- media-service만 도메인 기반 HTTP 호출

## 다음 단계

1. 통합 애플리케이션 모듈 생성 (`api-backend`)
2. user-domain과 audition-domain 통합
3. 같은 애플리케이션 컨텍스트에서 실행
4. 프로덕션 배포 시 통합 애플리케이션으로 배포

## 주의사항

- 현재 코드는 통합 구조를 전제로 작성됨
- 별도 모듈로 실행 시 컴파일 오류 발생 가능
- 프로덕션 배포 시 통합 애플리케이션으로 배포 필요
