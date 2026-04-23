/**
 * 네이티브 셸(WebView) 안에서 실행 중인지 판별하는 유틸.
 *
 * 판별 기준
 * - 네이티브 앱은 WebView UA에 "GlobalAuditionApp/x.x" 마커를 삽입한다 (mobile 앱 설정 참고).
 *
 * 왜 파일이 두 층으로 나뉘어 있나
 * - UA 마커 식별자는 서버/클라이언트 양쪽에서 같은 값이어야 하므로 본 파일에 두고 export 한다.
 * - 본 파일의 `isInNativeAppShell()`는 `navigator` 의존이라 **클라이언트 전용**이다.
 * - 서버 컴포넌트에서의 판별은 `resolveAppShell.ts`의 `getIsNativeAppShellFromHeaders()`를 쓴다.
 *   (next/headers를 여기 섞으면 클라이언트 번들에서 import 시 빌드 오류가 난다.)
 *
 * 사용 예
 * - 앱 내부에서는 PWA 설치 프롬프트처럼 "브라우저 전용" UI를 감춘다.
 * - 앱 내부에서는 서비스 워커 등록을 생략한다.
 * - 앱 내부에서는 하단 탭바 등 네이티브 UX와 중복되는 요소를 렌더하지 않는다.
 */
export const APP_UA_MARKER = 'GlobalAuditionApp'

/** 임의의 UA 문자열이 네이티브 앱 셸 UA인지 판별. 서버·클라이언트 공용 순수 함수. */
export function isNativeAppUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false
  return ua.includes(APP_UA_MARKER)
}

/** 현재 브라우저가 네이티브 앱 셸 안에서 실행 중인지 판별. 서버 환경에서는 항상 false. */
export function isInNativeAppShell(): boolean {
  if (typeof navigator === 'undefined') return false
  return isNativeAppUserAgent(navigator.userAgent)
}
