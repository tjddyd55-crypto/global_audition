'use client'

import { InstallPrompt } from './InstallPrompt'
import { useServiceWorker } from './useServiceWorker'

/**
 * 모바일 셸에서 1회만 렌더되는 부트스트랩 컴포넌트.
 *
 * - 서비스 워커 등록과 A2HS 프롬프트를 한 지점에서 관리한다.
 * - 렌더되는 DOM이 거의 없으므로 여러 페이지에 부착해도 비용이 낮다.
 */
export function PwaBootstrap() {
  useServiceWorker()
  return <InstallPrompt />
}
