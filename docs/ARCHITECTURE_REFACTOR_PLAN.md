# Architecture refactor foundation

이 문서는 오디션 플랫폼 확장 개발을 위한 구조 정리 기준이다.

## 목표

- 기존 API/DTO/DB 동작을 유지하면서 기능별 수정 위치를 명확히 한다.
- 대형 서비스/대형 API 파일에 계속 기능이 쌓이는 것을 막는다.
- 디자이너/퍼블리셔가 UI 수정 위치를 쉽게 찾을 수 있게 한다.

## 백엔드 서비스 경계

`ApplicationController`는 더 이상 거대한 `ApplicationService` 하나에 직접 의존하지 않고, 기능별 유스케이스 서비스에 의존한다.

- `ApplicationSubmitService`
  - 지원자 지원서 제출/조회 경계
  - 향후 `submitApplication` 검증/저장 로직 이동 대상
- `AgencyApplicationManageService`
  - 기획사/관리자 지원자 목록, 상세, 심사 보드 경계
  - 향후 목록 필터링/카테고리/차수 로직 이동 대상
- `ApplicationStatusService`
  - 지원 상태 변경 경계
  - 상태값 매핑, 히스토리 기록, 랭킹 재계산을 담당한다.
- `ApplicationVideoViewService`
  - 지원 영상 조회수 경계
  - 대표 영상 조회, 조회수 증가, 랭킹 재계산을 담당한다.

현재 상태:

- 1차 PR에서 컨트롤러가 기능별 서비스 경계를 바라보도록 변경했다.
- 2차 PR에서 `ApplicationStatusService`, `ApplicationVideoViewService`는 실제 로직을 보유하도록 이동했다.
- `ApplicationSubmitService`, `AgencyApplicationManageService`는 아직 기존 `ApplicationService`에 위임한다.

## 프론트 API 경계

기존 `frontend/web/src/shared/api/auditions.ts`는 유지한다. 기존 import 호환을 깨지 않기 위해 즉시 삭제/이동하지 않는다.

새 기능은 아래 경계를 우선 사용한다.

- `shared/api/auditions/public.ts`
  - 공개 오디션 조회
- `shared/api/auditions/manage.ts`
  - 기획사/관리자 오디션 관리
- `shared/api/auditions/votes.ts`
  - 투표/조회수
- `shared/api/auditions/ranking.ts`
  - 랭킹
- `shared/api/auditions/series.ts`
  - 다차/시리즈 오디션
- `shared/api/auditions/types.ts`
  - API 타입 재수출
- `shared/api/auditions/parsers.ts`
  - 파서 재수출

## UI 정리 원칙

디자인 변경은 별도 작업으로 분리한다. 이번 리팩토링은 구조 경계만 만든다.

향후 UI 컴포넌트는 아래 기준으로 둔다.

- `components/ui`: Button, Card, Badge, EmptyState 등 공용 단위
- `components/layout`: PageContainer, Section, StickyBottomBar 등 레이아웃 단위
- `components/audition`: 오디션 카드, 상세 히어로, 갤러리, CTA, 공유 버튼 등
- `components/home`: 홈 히어로, 홈 오디션 섹션, 홈 영상 섹션 등

## 금지사항

- API 경로 변경 금지
- DTO 필드명 변경 금지
- DB/Flyway 변경 금지
- 인증/권한 정책 변경 금지
- UI 디자인 전면 변경 금지
- 기존 import 대량 변경 금지
- `ApplicationService` 내부 로직을 한 번에 대량 이동 금지

## 다음 단계

1. `ApplicationService.submitApplication` 내부를 `ApplicationSubmitService`로 이동
2. 지원서 입력 검증을 `ApplicationValidationService`로 분리
3. 기획사 관리 목록/필터링을 `AgencyApplicationManageService`로 이동
4. 기존 `auditions.ts` 내부 구현을 기능별 파일로 실제 이동하고, `auditions.ts`는 호환 export만 유지
5. 홈/오디션 상세 UI를 컴포넌트 단위로 분리
