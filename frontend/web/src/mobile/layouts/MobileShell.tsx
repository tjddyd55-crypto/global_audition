import type { ReactNode } from 'react'
import { BottomTabBar } from '../components/BottomTabBar'
import { PwaBootstrap } from '../pwa/PwaBootstrap'
import { getIsNativeAppShellFromHeaders } from '@/shared/device/resolveAppShell'

const BOTTOM_TAB_HEIGHT_PX = 56

/**
 * 모바일 PWA 셸.
 *
 * 구성:
 * - 상단 앱바: 공용 Header(`components/layout/Header.tsx`)가 PC/모바일 겸용으로 이미 존재하므로 재사용.
 * - 하단 바텀탭: 홈/오디션/마이/프로필.
 * - safe-area: iOS 노치/홈바 대응(bottom)을 본 컴포넌트에서 선언.
 *
 * 왜 분리?
 * - `[locale]/layout.tsx`는 PC/모바일 공통 구조(Header/Footer, IntlProvider)를 책임.
 * - 모바일에만 필요한 UI는 본 셸이 `children` 하단에 주입해서, PC 렌더에는 영향을 주지 않는다.
 *
 * 네이티브 앱 셸(WebView) 내부일 때
 * - 바텀탭을 렌더하지 않는다. 네이티브 앱은 자체 뒤로가기/풀리프레시 등으로 이미
 *   기본적인 내비게이션을 제공하며, 화면 면적을 최대한 쓰는 쪽이 가독성에 유리하다.
 * - 모바일 웹(일반 브라우저)에서는 그대로 탭바를 유지한다.
 *   브라우저엔 기기 뒤로가기가 있어도 페이지 간 이동 내비게이션이 필수 UI다.
 *
 * 판별은 반드시 서버에서 UA로 한다 (`getIsNativeAppShellFromHeaders`).
 * 클라이언트 감지로 처리하면 초기 SSR HTML에 탭바가 포함된 뒤 hydration 시점에 사라져
 * 깜박임이 생긴다.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  const isNativeApp = getIsNativeAppShellFromHeaders()

  const contentPaddingBottom = isNativeApp
    ? 'env(safe-area-inset-bottom)'
    : `calc(${BOTTOM_TAB_HEIGHT_PX}px + env(safe-area-inset-bottom))`

  return (
    <div className="min-h-screen">
      <div style={{ paddingBottom: contentPaddingBottom }}>{children}</div>
      {!isNativeApp && <BottomTabBar />}
      <PwaBootstrap />
    </div>
  )
}
