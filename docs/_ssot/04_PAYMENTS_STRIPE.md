# 결제 아키텍처(SSOT)

## 현재 정산 통화 (Toss)
- 플랫폼 정산 통화는 **USD** (`platform_payment_settings.currency`, `payment_orders.currency`).
- 환율을 발명하지 않는다. KRW 정수 과금으로 되돌리지 않는다.
- Toss 공식: checkout `amount.value` 와 confirm `amount` 는 **같은 정수**. USD 는 달러 major-unit (`$10` → `10`). Stripe 센트(×100)가 아니다.
- 패키지 가격은 정수 달러만 허용 ($1 / $5 / $10). 소수 달러는 400.
- Toss 영문 문서상 USD 는 `FOREIGN_EASY_PAY` 공식 지원. 현재 체크아웃은 기존 `CARD` 창을 유지한다. CARD+USD 는 MID 계약에 의존하며 샌드박스 미실행.
- 지원 수수료는 **크레딧**이지 금액이 아니다.

## 1) 결제 대상(예시)
- 기획사 플랜(구독) 또는 공고 등록/노출 패키지(일회성)
- 트레이너 피드백(세션 단위 결제)
- 유료 칼럼/콘텐츠(향후)

## 2) 핵심 원칙
- 결제 상태는 “클라이언트 요청”이 아니라 **Stripe Webhook**을 최종 진실로 한다.
- 모든 webhook 처리는 **idempotent** 해야 한다(중복 이벤트/재전송 대비).
- 결제/환불/정산은 감사 가능한 이벤트 로그가 필요하다.

## 3) 구현 방향(단계적)
- 초기: 기존 서비스에 `billing` 모듈로 시작(공통 라이브러리) → 확장 시 `billing-service`로 분리
- 데이터: `payment_intents`, `subscriptions`, `webhook_events`(처리 여부/리트라이)

## 3-1) 현재 구현(Phase 4 최소)
- `stripe_webhook_events` 테이블에 이벤트 원문/서명 저장
- `event_id` 유니크로 **idempotent 저장** 보장
- 서명 검증은 다음 단계에서 적용

## 4) 운영 체크리스트
- webhook 서명 검증 필수
- 성공/실패/환불/차지백 흐름 테스트 시나리오 문서화
- 장애 시 “중복 처리 없이 재처리” 가능한 설계(Replay 가능)

