# 목 결제 · 콜백 · 결과 화면 (SSOT: Spring Boot)

프론트에 붙여 넣는 **Next.js `app/api` + Prisma** 패턴은 이 레포에서 사용하지 않는다.  
**주문 상태 전이·크레딧 지급·거래 기록**은 전부 백엔드 `PaymentOrderService` + `CreditService` 가 담당한다.

## URL 맵

| 구분 | 경로 |
|------|------|
| 목 결제 UI | `/{locale}/credits/mock-pay?orderNo=...` |
| 결제 직전 | `/{locale}/credits/checkout?packageId=...` |
| 성공 결과 | `/{locale}/credits/result/success?orderNo=...` |
| 실패 결과 | `/{locale}/credits/result/fail?orderNo=...&reason=...` |
| 성공 콜백 API | `POST {NEXT_PUBLIC_API_URL}/api/payments/callback/success` |
| 실패 콜백 API | `POST {NEXT_PUBLIC_API_URL}/api/payments/callback/fail` |

프론트는 `apiFetch`/`creditsApi.paymentSuccessCallback` 으로 위 백엔드 URL을 호출한다 (`src/lib/api/credits.ts`).

## 요청 본문 (백엔드 DTO)

**성공**

```json
{
  "orderNo": "ORD-...",
  "providerTxId": "MOCK-1739...",
  "payload": { "source": "MOCK_UI" }
}
```

**실패**

```json
{
  "orderNo": "ORD-...",
  "reason": "USER_CANCEL_MOCK",
  "payload": { "source": "MOCK_UI" }
}
```

응답: **204 No Content** (본문 없음).

프론트 `assertPaymentCallbackOk`: `res.ok || res.status === 204` 이면 성공. (`ok`만 검사 시 일부 환경에서 오판 가능성 대비)

## 라우팅 (locale)

- `next-intl` 의 `useRouter`(`@/i18n.config`)는 **`/credits/...` 처럼 locale 없는 경로**를 받아 현재 locale 을 붙인다.
- **`router.push(\`/${locale}/credits/...\`)` 형태는 금지** — 이중 locale(`/ko/ko/...`) 위험.
- 표시용·감사 payload 에만 `useLocale()` 사용 가능.

## 콜백 → 리다이렉트 순서

1. `await paymentSuccessCallback` / `paymentFailCallback` 완료 (DB 반영)
2. 그 다음에만 `router.push` 로 result 페이지

(콜백 없이 result 만 열면 안 됨)

**코드 강제:** `try/catch` 에서 **catch 블록에는 `router.push` 금지**. 실패 시 `alert` + 화면 에러만 표시 (mock-pay).

## 환경 변수

- `NEXT_PUBLIC_CREDIT_MOCK_PAYMENT` — 미설정이면 목 결제 UI 기본 활성 (`true`/`1` 명시 권장).

## 운영 전 수동 테스트 체크리스트

1. mock-pay에서 **결제 성공 (목)** 클릭.
2. DB: `payment_orders.status = PAID`.
3. `user_credits.balance` 증가.
4. `credit_transactions` 에 CHARGE 행 생성.
5. **중복 클릭**: 성공 버튼을 연속 2회 눌러도 크레딧은 **1번만** 증가(백엔드 멱등 + UI `busy` 비활성화).
6. 관리자 화면에서 거래 내역·로그 확인.

전체 플로우: 로그인 → `/credits/charge` → `/credits/checkout` → 주문 생성 → **결제 진행 (목)** → mock-pay.

## 코드 위치

- 백엔드 콜백: `PaymentCallbackController`, `PaymentOrderService.handleSuccessCallback` / `handleFailureCallback`
- 프론트: `frontend/web/src/app/[locale]/credits/mock-pay/page.tsx`, `result/success`, `result/fail`, `lib/api/credits.ts`
