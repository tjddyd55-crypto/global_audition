/**
 * ============================================================================
 * 환경 변수 가드 모듈 (SSOT)
 * ============================================================================
 * 
 * Next.js 빌드 타임에 환경 변수가 하드코딩되므로,
 * 빌드 시점에 누락된 환경 변수는 즉시 에러를 발생시킵니다.
 * 
 * 사용법:
 * import { API_BASE_URL } from '@/lib/env'
 * 
 * ❌ 금지: process.env.NEXT_PUBLIC_* 직접 사용
 * 
 * ENV 분류:
 * - NEXT_PUBLIC_*: 클라이언트 사이드 접근 가능 (브라우저 노출)
 * - Server-only ENV: 클라이언트 코드에서 접근 금지
 * 
 * 필수 ENV:
 * - NEXT_PUBLIC_API_URL (필수) - 빌드 타임 가드 적용
 *   문서상 NEXT_PUBLIC_API_BASE_URL와 동일 역할 (현재 프로젝트는 NEXT_PUBLIC_API_URL 사용)
 * 
 * 선택 ENV:
 * - NEXT_PUBLIC_LOCALE (기본값: 'ko')
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (기본값: '')
 */

/**
 * API Base URL
 * Railway Variables에서 NEXT_PUBLIC_API_URL로 설정 필요
 */
export const API_BASE_URL = (() => {
  const v = process.env.NEXT_PUBLIC_API_URL
  
  if (!v || v.trim() === '') {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not defined. ' +
      'Please set NEXT_PUBLIC_API_URL in Railway Variables. ' +
      'Example: https://gateway-production-72d6.up.railway.app'
    )
  }
  
  // 끝의 슬래시 제거 및 공백 제거
  return v.trim().replace(/\/+$/, '')
})()

/**
 * 기본 로케일
 */
export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'ko'

/**
 * Stripe Publishable Key (선택)
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
