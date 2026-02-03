# 프로덕션 통합 구조 가이드

## 중요 원칙

**api-backend는 Railway 서비스 이름일 뿐, 실제 폴더명이 아님**
- ❗ `api-backend` 폴더를 만들지 않음
- ✅ Root Directory: `backend` (또는 repo-root)
- ✅ 엔트리 포인트: `gateway` (backend/services/gateway)
- ✅ 폴더 구조 변경 금지

## 현재 상황
- **코드 구조**: user-service와 audition-service가 별도 모듈 (폴더 구조 유지)
- **프로덕션 구조**: api-backend (Railway 서비스 이름) = gateway + user + audition 통합
- **Root Directory**: `backend`
- **엔트리 포인트**: `gateway` (backend/services/gateway)

## 통합 배포 구조

- **현재 구조 유지**: 폴더 구조는 변경하지 않음
- **Root Directory**: `backend` (Railway에서 설정)
- **엔트리 포인트**: `gateway` (backend/services/gateway)
- **통합 배포**: Railway에서 Root Directory를 `backend`로 설정하고 gateway를 실행
- UserServiceClient, PointServiceClient는 직접 서비스 주입 사용 (통합 배포 시)

## 현재 적용된 변경
- UserServiceClient: HTTP 호출 → 직접 서비스 주입 (통합 구조 전제)
- PointServiceClient: HTTP 호출 → 직접 서비스 주입 (통합 구조 전제)

## Railway 배포 설정

### api-backend 서비스 (Railway 서비스 이름)
- **Root Directory**: `backend`
- **Build Command**: `./gradlew clean build` (backend에서 실행)
- **Start Command**: `java -jar services/gateway/build/libs/gateway.jar`

## 주의사항
- ❗ **폴더 구조 변경 금지**: gateway, user-service, audition-service 폴더 구조 유지
- ❗ **api-backend 폴더 생성 금지**: Railway 서비스 이름일 뿐
- ✅ **gateway가 엔트리 포인트**: backend/services/gateway에서 시작
- ✅ **현재 구조 유지**: 논리적 모듈로만 분리, 폴더 구조는 변경하지 않음
