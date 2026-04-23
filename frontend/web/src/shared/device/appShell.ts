/**
 * 네이티브 셸(WebView) 안에서 실행 중인지 판별하는 클라이언트 유틸.
 *
 * 판별 기준
 * - 네이티브 앱은 WebView UA에 "GlobalAuditionApp/x.x" 마커를 삽입한다 (mobile 앱 설정 참고).
 * - 서버 환경에서는 항상 false를 반환한다.
 *
 * 사용 예
 * - 앱 내부에서는 PWA 설치 프롬프트처럼 "브라우저 전용" UI를 감춘다.
 * - 앱 내부에서는 서비스 워커 등록을 생략한다.
 */
const APP_UA_MARKER = 'GlobalAuditionApp'

export function isInNativeAppShell(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent ?? ''
  return ua.includes(APP_UA_MARKER)
}
