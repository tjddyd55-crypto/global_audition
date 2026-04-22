import type { ReactNode } from 'react'
import { BottomTabBar } from '../components/BottomTabBar'
import { PwaBootstrap } from '../pwa/PwaBootstrap'

/**
 * 모바일 PWA 셸.
 *
 * 구성:
 * - 상단 앱바: 현재는 Header(공용)가 PC/모바일 겸용으로 이미 존재하므로 재사용하고,
 *   본 셸에서는 하단 바텀탭과 safe-area 보정만 책임진다.
 * - 바텀탭: 홈/오디션/마이/프로필.
 * - safe-area: iOS 노치/홈바 대응(bottom)을 본 컴포넌트에서 선언.
 *
 * 왜 분리?
 * - `[locale]/layout.tsx`는 PC/모바일 공통 구조(Header/Footer, IntlProvider)를 책임.
 * - 모바일에만 필요한 UI는 본 셸이 `children` 하단에 주입해서, PC 렌더에는 영향을 주지 않는다.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* 바텀탭 고정 높이(약 56px)를 본문 하단 여백으로 확보 */}
      <div style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>{children}</div>
      <BottomTabBar />
      <PwaBootstrap />
    </div>
  )
}
