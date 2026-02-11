# MVP_02: 채널 공개 범위 정책 (고정)

## 공개 범위 (ChannelVisibility)

### PUBLIC
- **정의**: 모든 사용자가 조회 가능
- **로그인**: 불필요
- **권한**: 제한 없음
- **용도**: 공개 채널, 모든 사용자가 탐색 가능

### PRIVATE
- **정의**: 소유자 또는 ADMIN만 조회 가능
- **로그인**: 필수 (소유자 또는 ADMIN)
- **권한**: 
  - 소유자 (APPLICANT 본인)
  - ADMIN (운영자)
- **용도**: 비공개 채널, 개인 정보 보호

### UNLISTED
- **정의**: PUBLIC과 동일 (향후 확장 가능)
- **로그인**: 불필요
- **권한**: 제한 없음
- **용도**: 링크로만 접근 가능한 채널 (향후 구현)

## API 검증 규칙

### 채널 조회 (`GET /api/v1/channels/{userId}`)
1. **PUBLIC/UNLISTED**: 모든 사용자 조회 가능
2. **PRIVATE**: 
   - 소유자 (`requesterId == userId`) → 허용
   - ADMIN → 허용
   - 그 외 → 403 FORBIDDEN

### 채널 수정 (`PUT /api/v1/channels/me`)
1. **소유자만 수정 가능** (APPLICANT 본인)
2. 권한 체크: `UserRoleValidator.requireApplicant(userId)`
3. 다른 사용자 수정 시도 → 403 FORBIDDEN

## 기본값
- 신규 채널 생성 시: **PUBLIC**
- 기존 채널 (visibility == null): **PUBLIC**

## 변경 이력
- MVP_02: 정책 고정 및 검증 강화
- ADMIN 권한 추가 (PRIVATE 채널 조회 가능)
