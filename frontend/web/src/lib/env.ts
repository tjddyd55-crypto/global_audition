/**
 * 클라이언트 번들 환경 변수 (SSOT)
 *
 * API 호출은 동일 Origin `/api/*` + `next.config.js` rewrites 로 백엔드에 프록시한다.
 * 브라우저가 백엔드 절대 URL을 알 필요 없음 → NEXT_PUBLIC_API_URL 제거.
 */

export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'ko'

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
