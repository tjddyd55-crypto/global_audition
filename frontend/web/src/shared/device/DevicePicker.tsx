import type { ReactNode } from 'react'
import { getDeviceFromHeaders } from './resolveDevice'

/**
 * 서버 컴포넌트 레벨에서 device에 따라 PC/모바일 UI를 선택하는 디스패처.
 *
 * 각 라우트의 `page.tsx`는 최소한의 래퍼로 두고, 실제 UI는 `src/pc/pages`, `src/mobile/pages`에
 * 각각 독립적으로 배치한다. 이렇게 하면 라우트 목록은 `app/[locale]` 한 곳만 유지하면서
 * UI/UX는 완전히 분리된 두 트리로 관리할 수 있다.
 *
 * @param pc     device=pc일 때 렌더할 노드
 * @param mobile device=mobile일 때 렌더할 노드. 생략하면 PC 노드로 폴백(= PC 전용 페이지).
 */
export function DevicePicker({
  pc,
  mobile,
}: {
  pc: ReactNode
  mobile?: ReactNode
}) {
  const device = getDeviceFromHeaders()
  if (device === 'mobile' && mobile != null) return <>{mobile}</>
  return <>{pc}</>
}
