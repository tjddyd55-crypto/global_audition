import Constants from 'expo-constants'
import { isLoopbackApiUrl } from './envUrl'

/**
 * 앱 전역 환경 값.
 *
 * API Origin은 웹과 같은 Railway 프론트 프록시(`/api`)를 기본으로 쓴다.
 * 백엔드 도메인을 새로 만들지 않고, 기존 rewrite SSOT를 재사용한다.
 */
type Extra = {
  webUrl?: string
  apiUrl?: string
  allowedHosts?: string[]
  buildProfile?: string
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra

export const WEB_URL: string =
  process.env.EXPO_PUBLIC_WEB_URL?.trim() || extra.webUrl?.trim() || 'https://frontend-production-8613a.up.railway.app'

/**
 * 실기기 Android는 localhost/127.0.0.1 이 폰 자신을 가리킨다.
 * 우선순위: EXPO_PUBLIC_API_URL → extra.apiUrl → `${WEB_URL}/api` (웹 프록시 SSOT).
 */
export const API_BASE_URL: string = normalizeApiBase(
  process.env.EXPO_PUBLIC_API_URL?.trim() || extra.apiUrl?.trim() || `${WEB_URL.replace(/\/+$/, '')}/api`,
)

export { isLoopbackApiUrl }

export function isCurrentApiLoopback(): boolean {
  return isLoopbackApiUrl(API_BASE_URL)
}

export const ALLOWED_HOSTS: string[] = Array.isArray(extra.allowedHosts)
  ? extra.allowedHosts.map((s) => s.toLowerCase())
  : []

export const BUILD_PROFILE: string = extra.buildProfile ?? 'local'

export function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }
    if (ALLOWED_HOSTS.length === 0) return true
    return ALLOWED_HOSTS.includes(parsed.host.toLowerCase())
  } catch {
    return false
  }
}

function normalizeApiBase(raw: string): string {
  return raw.replace(/\/+$/, '')
}
