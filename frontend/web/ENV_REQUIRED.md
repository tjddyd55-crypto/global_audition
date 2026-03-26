# Frontend Web — 필수 환경 변수

## BACKEND_PROXY_ORIGIN (프로덕션·커스텀 백엔드 URL 시 권장)

Next.js **서버**에서만 사용. 클라이언트 번들에 포함되지 않음.

- 의미: `GET /api/*` 요청을 받은 Next가 **어느 백엔드 Origin** 으로 넘길지 (`rewrites`).
- Railway(프론트) Variables 예: `BACKEND_PROXY_ORIGIN=https://backend-production-b968.up.railway.app`
- 미설정 시: 개발은 `http://127.0.0.1:8081`, 프로덕션은 위 프로덕션 백엔드 기본값.

## 동작 요약

- 브라우저·axios·fetch: **`/api/...` 만 호출** (동일 Origin → 프리플라이트/CORS 없음).
- **`NEXT_PUBLIC_API_URL` 은 사용하지 않음.**

## 기타 (선택)

- `NEXT_PUBLIC_LOCALE`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CREDIT_MOCK_PAYMENT` 등은 기존과 동일.
