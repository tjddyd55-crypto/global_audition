# Frontend Web — 필수 환경 변수

## APP_CORS_ALLOWED_ORIGINS (브라우저가 백엔드를 직접 호출할 때)

- 쉼표로 구분한 정확한 Origin. 예: `https://frontend-production-8613a.up.railway.app`
- 동일 Origin으로 Next만 호출(` /api` rewrite)하는 구성에서는 필수는 아니나, 교차 출처 API를 쓸 때 `allowCredentials` 와 함께 설정한다.

## APP_AUTH_COOKIE_ENABLED / APP_AUTH_COOKIE_SAMESITE

- 로그인 시 `accessToken` HttpOnly 쿠키(기본 활성). 끄려면 `APP_AUTH_COOKIE_ENABLED=false`
- 교차 사이트 XHR: `APP_AUTH_COOKIE_SAMESITE=None`(HTTPS에서 Secure와 함께 동작). 로컬 HTTP는 백엔드가 자동으로 Lax로 폴백.

## BACKEND_PROXY_ORIGIN (프로덕션·커스텀 백엔드 URL 시 권장)

Next.js **서버**에서만 사용. 클라이언트 번들에 포함되지 않음.

- 의미: `GET /api/*` 요청을 받은 Next가 **어느 백엔드 Origin** 으로 넘길지 (`rewrites`).
- Railway(프론트) Variables 예: `BACKEND_PROXY_ORIGIN=https://backend-production-b968.up.railway.app`
- 미설정 시: 개발은 `http://127.0.0.1:8081`, 프로덕션은 위 프로덕션 백엔드 기본값.

## 로컬 브라우저 주소

공식 주소는 `http://localhost:<포트>`다. `accessToken` 쿠키는 `Domain`을 두지 않아 `127.0.0.1`과 공유하지 않는다. 로컬 HTTP에서는 `SameSite=Lax`, `Secure` 없음. `next dev`의 절대 리다이렉트 `Location`은 `localhost`로 고정된다.

## 동작 요약

- 브라우저·axios·fetch: **`/api/...` 만 호출** (동일 Origin → 프리플라이트/CORS 없음).
- **`NEXT_PUBLIC_API_URL` 은 사용하지 않음.**

## 기타 (선택)

- `NEXT_PUBLIC_LOCALE`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CREDIT_MOCK_PAYMENT` 등은 기존과 동일.
