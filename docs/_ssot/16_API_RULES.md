# API 규칙 (SSOT)

이 문서는 Global Audition Platform의 API 설계 규칙을 정의한다.

## RESTful 설계 원칙
- RESTful API 설계 준수
- 리소스 중심 URL 구조
- HTTP 메서드 의미에 맞는 사용 (GET, POST, PUT, DELETE)

## 내부 API와 외부 API 분리

### 외부 API
- 경로: `/api/v1/**`
- 용도: 프론트엔드/모바일 클라이언트 사용
- 인증: JWT 토큰 필수
- Gateway를 통한 라우팅

### 내부 API
- 경로: `/internal/**`
- 용도: 서비스 간 통신 전용
- 인증: 서비스 간 인증 (향후 구현)
- Gateway 라우팅 제외

## Entity 직접 노출 금지
- **절대 금지**: Entity 클래스를 직접 응답으로 사용
- **필수**: DTO(Data Transfer Object) 사용
- 이유: 
  - 내부 구조 노출 방지
  - API 계약 안정성 유지
  - 버전 관리 용이

## API 버전 관리
- 현재 버전: `/api/v1/**`
- 버전 변경 시: `/api/v2/**` 형식으로 확장
- 하위 호환성 유지 원칙

## 에러 응답 형식
```json
{
  "message": "에러 메시지",
  "status": 400,
  "error": "에러 타입",
  "timestamp": "2026-01-10T00:00:00Z"
}
```

## 성공 응답 형식
- 단일 리소스: 객체 직접 반환
- 목록: Page 객체 또는 배열 반환
- 생성: 201 Created + 생성된 리소스
- 수정: 200 OK + 수정된 리소스
- 삭제: 204 No Content

## 인증/인가
- 모든 외부 API는 JWT 토큰 필수
- 토큰은 `Authorization: Bearer {token}` 형식
- 내부 API는 향후 서비스 간 인증 구현 예정
