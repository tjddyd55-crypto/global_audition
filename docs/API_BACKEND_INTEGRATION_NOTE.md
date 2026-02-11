# api-backend 통합 배포 주의사항

## 중요 원칙

**api-backend는 Railway 서비스 이름일 뿐, 실제 폴더명이 아님**
- ❗ `api-backend` 폴더를 만들지 않음
- ✅ Root Directory: `backend` (또는 repo-root)
- ✅ 엔트리 포인트: `gateway` (backend/services/gateway)
- ✅ 폴더 구조 변경 금지

## 현재 상황

서버 기준선(SSOT)에 따르면:
- **api-backend** (Railway 서비스 이름): gateway + user-domain + audition-domain이 하나의 배포 단위
- localhost/포트 기반 통신 금지
- api-backend 내부는 직접 서비스 주입 사용

## 코드 구조

현재 코드는 별도 모듈로 구성되어 있음 (폴더 구조 유지):
- `backend/services/gateway`: gateway (엔트리 포인트)
- `backend/services/user-service`: user-domain
- `backend/services/audition-service`: audition-domain

## 통합 배포 시 요구사항

- **현재 구조 유지**: 폴더 구조는 변경하지 않음
- **gateway가 엔트리 포인트**: backend/services/gateway에서 시작
- **통합 배포**: Railway에서 Root Directory를 `backend`로 설정하고 gateway를 실행
- UserServiceClient, PointServiceClient는 직접 서비스 주입 사용 (통합 배포 시)

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

## Railway 배포 설정

### api-backend 서비스
- **Railway 서비스 이름**: `api-backend`
- **Root Directory**: `backend` - **반드시 `backend`로 설정**
- **Build Command**: `./gradlew clean build` (backend에서 실행)
- **Start Command**: `java -jar services/gateway/build/libs/gateway.jar` (gateway가 엔트리 포인트)

#### 빌드 오류 해결
- **`./gradlew not found` 오류 발생 시**: Root Directory 설정 문제
  - gradlew는 `backend/`에 존재
  - Root Directory는 반드시 `backend`로 설정
  - ❗ gradlew를 이동/복사/재생성하지 않음

## 주의사항

- ❗ **폴더 구조 변경 금지**: gateway, user-service, audition-service 폴더 구조 유지
- ❗ **api-backend 폴더 생성 금지**: Railway 서비스 이름일 뿐
- ✅ **gateway가 엔트리 포인트**: backend/services/gateway에서 시작
- ✅ **현재 구조 유지**: 논리적 모듈로만 분리, 폴더 구조는 변경하지 않음
