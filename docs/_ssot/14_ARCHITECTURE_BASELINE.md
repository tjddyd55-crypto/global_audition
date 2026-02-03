# 아키텍처 기준선 (SSOT)

이 문서는 Global Audition Platform의 아키텍처 기준선을 정의한다.

## 서비스 구조

### Gateway Service
- **책임**: 인증, 라우팅, 공통 정책 (CORS, Rate Limiting)
- **포트**: 8080
- **접근**: 외부 API 요청의 진입점

### User Service
- **책임**: 사용자/기획사 SSOT (Single Source of Truth)
- **포트**: 8082
- **데이터 소유**: users, applicant_profiles, business_profiles
- **제공**: 인증, 프로필 관리, 사용자 정보 조회

### Audition Service
- **책임**: 오디션/지원 관리
- **포트**: 8081
- **데이터 소유**: auditions, applications, audition_stages
- **제공**: 오디션 CRUD, 지원 관리, 심사 프로세스

### Media Service
- **책임**: 영상/이미지 관리
- **포트**: 8083
- **데이터 소유**: video_contents
- **제공**: 비디오 콘텐츠 관리, YouTube 연동

## 하드 규칙

### 1. 서비스 간 DB 접근 금지
- 각 서비스는 **자신의 데이터베이스만** 직접 접근 가능
- 다른 서비스의 데이터가 필요하면 **내부 API** 사용

### 2. 내부 API 사용 원칙
- 내부 API는 `/internal/**` 경로 사용
- 내부 API는 서비스 간 통신 전용 (외부 노출 금지)
- Gateway를 통한 라우팅에서 제외

### 3. 데이터 소유권
- User Service: 사용자/기획사 정보의 유일한 소스
- Audition Service: 오디션/지원 정보의 유일한 소스
- Media Service: 미디어 콘텐츠의 유일한 소스

## 서비스 간 통신

### 내부 API 호출
```
Audition Service → User Service (/internal/users/{userId}/summary)
Media Service → User Service (/internal/users/{userId}/summary)
```

### 통신 방식
- HTTP REST API
- 동기 호출 (필요 시 비동기 확장 가능)

## 확장 원칙
- 서비스 추가 시 명확한 데이터 소유권 정의
- 내부 API 계약 문서화 필수
- 서비스 간 의존성 최소화
