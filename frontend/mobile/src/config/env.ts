import Constants from 'expo-constants'

/**
 * 앱 전역에서 참조하는 환경 값.
 *
 * 결정
 * - 값의 출처를 app.config.ts의 extra로 단일화한다. WebView URL은 런타임에 바꿀 일이 없으므로
 *   빌드 타임 주입(EXPO_PUBLIC_WEB_URL)으로 충분하다.
 * - 호스트 허용 목록(allowedHosts)은 "내부 탐색"과 "외부 브라우저 오픈"을 가르는 기준이 된다.
 * - allowedHosts가 비어 있으면 안전하게 "아무 것도 외부로 열지 않는다"로 본다(앱 안에서만 이동).
 */
type Extra = {
  webUrl?: string
  allowedHosts?: string[]
  buildProfile?: string
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra

export const WEB_URL: string =
  extra.webUrl?.trim() || 'https://global-audition.example.com'

export const ALLOWED_HOSTS: string[] = Array.isArray(extra.allowedHosts)
  ? extra.allowedHosts.map((s) => s.toLowerCase())
  : []

export const BUILD_PROFILE: string = extra.buildProfile ?? 'local'

/**
 * 주어진 URL이 앱 내부에서 계속 탐색할 대상인지 판별.
 * - 내부 이동(true): WebView 내에서 로드
 * - 외부 이동(false): 시스템 브라우저/메일앱/전화앱 등으로 넘긴다.
 */
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
