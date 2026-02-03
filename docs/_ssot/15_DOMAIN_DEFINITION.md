# 도메인 정의 (SSOT)

이 문서는 각 도메인의 소유권과 책임을 명확히 정의한다.

## User / Business Domain
- **Owner**: User Service
- **책임**: 
  - 사용자 인증/인가
  - 사용자 프로필 관리 (지원자/기획사)
  - 기획사 정보 관리
  - 사용자 정보 조회 API 제공

## Audition / Application Domain
- **Owner**: Audition Service
- **책임**:
  - 오디션 공고 생성/수정/삭제
  - 지원 관리
  - 심사 단계 관리
  - 오디션 통계

## MediaContent Domain
- **Owner**: Media Service
- **책임**:
  - 비디오 콘텐츠 관리
  - YouTube 연동
  - 이미지 관리
  - 미디어 메타데이터 관리

## 도메인 간 관계

### Audition Service → User Service
- 오디션 생성 시 기획사 정보 필요
- 지원자 정보 조회 필요
- **방법**: 내부 API 호출

### Media Service → User Service
- 비디오 콘텐츠 소유자 정보 필요
- **방법**: 내부 API 호출

### Audition Service → Media Service
- 지원 시 비디오 콘텐츠 참조
- **방법**: 비디오 ID 참조 (직접 접근 금지)

## 데이터 소유권 원칙
- 각 도메인은 자신의 데이터만 직접 수정 가능
- 다른 도메인의 데이터는 읽기 전용 또는 API를 통한 조회만 가능
