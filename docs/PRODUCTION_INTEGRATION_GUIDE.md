# 프로덕션 통합 구조 가이드

## 현재 상황
- **코드 구조**: user-service와 audition-service가 별도 모듈
- **프로덕션 구조**: api-backend (gateway + user + audition 통합)

## 해결 방안

### 옵션 1: 통합 애플리케이션 생성 (권장)
- api-backend 모듈 생성
- user-service와 audition-service의 패키지를 통합
- 같은 애플리케이션 컨텍스트에서 실행

### 옵션 2: 현재 구조 유지 + 환경 변수 조정
- UserServiceClient, PointServiceClient를 HTTP 호출로 유지
- 환경 변수: `user.service.url=http://localhost:8080` (같은 서버 내부)
- 프로덕션에서는 localhost로 호출 (같은 컨테이너/프로세스)

## 현재 적용된 변경
- UserServiceClient: HTTP 호출 → 직접 서비스 호출 (통합 구조 전제)
- PointServiceClient: HTTP 호출 → 직접 서비스 호출 (통합 구조 전제)

## 다음 단계
1. 통합 애플리케이션 모듈 생성
2. user-service와 audition-service 패키지 통합
3. 같은 애플리케이션 컨텍스트에서 실행

## 주의사항
- 현재 코드는 통합 구조를 전제로 작성됨
- 별도 모듈로 실행 시 컴파일 오류 발생 가능
- 프로덕션 배포 시 통합 애플리케이션으로 배포 필요
