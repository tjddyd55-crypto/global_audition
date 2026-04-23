import { headers } from 'next/headers'
import { isNativeAppUserAgent } from './appShell'

/**
 * 서버 컴포넌트에서 현재 요청이 네이티브 앱 셸(WebView) 내부에서 온 것인지 판별한다.
 *
 * 왜 서버에서 확인하는가
 * - 클라이언트용 `isInNativeAppShell()`은 `navigator` 의존이라 SSR 시 항상 false가 된다.
 * - 그 결과, 초기 HTML에는 바텀탭 같은 "웹 전용 UI"가 포함된 채 내려가고
 *   hydration 직후 사라지는 깜박임(FOUC)이 발생한다.
 * - 여기서 서버가 UA로 먼저 판단하면, 네이티브 앱에는 처음부터 해당 UI가 빠진 HTML을 내려줄 수 있다.
 *
 * 주의
 * - `headers()`를 호출하는 순간 해당 페이지는 dynamic rendering이 된다.
 *   (이 프로젝트는 이미 `getDeviceFromHeaders()`로 device 기반 분기를 하고 있어 추가 손해 없음.)
 */
export function getIsNativeAppShellFromHeaders(): boolean {
  const ua = headers().get('user-agent')
  return isNativeAppUserAgent(ua)
}
