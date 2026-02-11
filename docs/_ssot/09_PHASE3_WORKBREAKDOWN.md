# Phase 3 상세 실행 계획(SSOT)

Phase 3의 목표는 **트레이너 피드백 + 칼럼 콘텐츠**의 기본 플로우를 완성하는 것이다.

## 범위
- 피드백 요청/수락/완료 흐름
- 칼럼 작성/발행/조회

## 비범위
- 결제/정산
- 번역 파이프라인
- 고급 추천/랭킹

## 작업 스트림

### 현재 구현 가정
- 트레이너/칼럼니스트 권한은 `ADMIN`으로 매핑

### 1) 피드백 세션
#### 목표
- 지원자가 피드백을 요청하고 트레이너가 수락/완료

#### 작업 항목
- `FeedbackSession` 모델/상태 정의(REQUESTED/ACCEPTED/REJECTED/COMPLETED)
- 요청/수락/완료 API

#### 완료 조건
- 기본 상태 전이가 정상 동작

---

### 2) 칼럼 콘텐츠
#### 목표
- 칼럼 생성/발행/조회

#### 작업 항목
- `Column` 모델/상태 정의(DRAFT/PUBLISHED)
- 작성/발행/조회 API

#### 완료 조건
- 공개 칼럼 목록/상세 조회 가능

---

## 현재 구현(최소)
- 테이블: `feedback_sessions`, `columns`
- API:
  - `POST /api/v1/feedback/requests`
  - `PUT /api/v1/feedback/sessions/{id}/status`
  - `GET /api/v1/feedback/my`
  - `GET /api/v1/feedback/instructor`
  - `GET /api/v1/columns`
  - `GET /api/v1/columns/{id}`
  - `POST /api/v1/columns`
  - `PUT /api/v1/columns/{id}/publish`

