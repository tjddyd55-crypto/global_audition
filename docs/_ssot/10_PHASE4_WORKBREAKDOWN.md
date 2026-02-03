# Phase 4 상세 실행 계획(SSOT)

Phase 4의 목표는 **번역 파이프라인 + 결제(Stripe) 기반**을 확보하는 것이다.

## 범위
- 번역 작업 큐/기록
- Stripe 웹훅 수신 및 이벤트 저장

## 비범위
- 실제 결제 상품 설계
- 번역 품질 최적화/튜닝

## 작업 스트림

### 1) 번역 파이프라인 최소 구현
#### 목표
- 번역 작업을 기록하고 상태를 추적

#### 작업 항목
- `TranslationJob` 모델/상태 정의(PENDING/COMPLETED/FAILED)
- 번역 작업 생성 API(내부용)

#### 완료 조건
- 번역 작업이 저장되고 상태를 변경할 수 있음

---

### 2) Stripe 웹훅 수신
#### 목표
- Stripe 이벤트를 수신/저장하고 중복을 방지

#### 작업 항목
- `StripeWebhookEvent` 모델 정의(이벤트 ID/상태/원문)
- 웹훅 수신 API

#### 완료 조건
- 중복 이벤트 재수신 시에도 안전하게 저장 처리

---

## 현재 구현(최소)
- 테이블: `translation_jobs`, `stripe_webhook_events`
- API:
  - `POST /api/v1/translations/jobs`
  - `GET /api/v1/translations/jobs/{id}`
  - `POST /api/v1/billing/webhook`
- 번역 API는 `ADMIN` 권한 필요(내부용)
- 서명 검증/큐 처리/Provider 연동은 후속 단계

