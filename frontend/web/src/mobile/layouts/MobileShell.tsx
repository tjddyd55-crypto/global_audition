import type { ReactNode } from 'react'
import { PwaBootstrap } from '../pwa/PwaBootstrap'

/**
 * 모바일 PWA 셸.
 *
 * 상단 앱바는 공용 Header가 담당한다.
 * 하단 고정 탭바는 사용하지 않는다.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>{children}</div>
      <PwaBootstrap />
    </div>
  )
}
