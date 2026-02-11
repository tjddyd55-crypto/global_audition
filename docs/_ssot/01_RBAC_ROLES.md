# 역할/권한 체계(SSOT)

## 1) 원칙
- 권한은 “화면 기준”이 아니라 **행위(Action) 기준**으로 정의한다.
- 사용자는 **복수 역할**을 가질 수 있다고 가정한다(특히 운영/콘텐츠 역할).
- 조직(기획사) 컨텍스트 권한과 전역(본사) 권한을 분리한다.

## 2) 역할 정의(초안)
- **APPLICANT**: 지원자/개인 유저(채널 운영)
- **AGENCY_MEMBER**: 기획사 소속 사용자(오디션 운영/평가)
- **HQ_ADMIN**: 본사 슈퍼관리자(전역 관리)
- **COLUMNIST**: 칼럼 작성/발행
- **INSTRUCTOR**: 피드백 제공(트레이너)

## 2-1) 현재 구현(Phase 1 최소) 매핑
- 현재 코드의 `UserType`은 `APPLICANT / BUSINESS / ADMIN` 3종이다.
- Phase 1에서는 아래 매핑으로 운영한다:
  - `APPLICANT` → `APPLICANT`
  - `AGENCY_MEMBER` → `BUSINESS`
  - `HQ_ADMIN` → `ADMIN`
- Phase 3까지는 다음 역할을 `ADMIN`으로 임시 매핑한다:
  - `COLUMNIST` → `ADMIN`
  - `INSTRUCTOR` → `ADMIN`
- JWT 클레임은 **`userType` 단일 값**을 사용하며,
  서비스 단에서는 `ROLE_{userType}` 형태로 권한을 부여한다.
  (향후 `roles[]` 확장 시 하위 호환 유지)

## 3) 권한(예시 Action)
### Audition
- `audition:create`, `audition:update`, `audition:publish`
- `audition:view_all` (기획사 내부/전역)
- `application:review`, `application:stage_move`, `application:finalize`

### Channel/Content
- `channel:manage_own`, `channel:publish_video`
- `channel:view_sensitive` (기획사 평가용 비공개 정보 접근 등)

### Column/Feedback
- `column:write`, `column:publish`
- `feedback:provide`, `feedback:moderate`

### Admin
- `admin:manage_users`, `admin:manage_agencies`, `admin:policy_override`

## 4) 멀티테넌시(기획사) 권한
- `AGENCY_MEMBER`는 “어느 기획사에 속했는지”가 권한 계산의 일부다.
- 같은 사용자가 여러 기획사에 속할 수 있는지 여부는 정책으로 결정하되, 모델은 확장 가능하게 둔다.

## 5) 구현 가이드(현 코드와의 연결)
- 현재 `user-service`가 인증/JWT를 담당하므로, 토큰 클레임에 **userId + roles + (agencyId optional)** 를 담는 방향을 기본으로 한다.
- 서비스 간 권한 판단은 “게이트웨이 선필터” + “각 서비스의 최종 검증(Defense in depth)”로 이중화한다.

