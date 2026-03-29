import type { ReactNode } from 'react'

/**
 * PC(lg+)에서만 max-width·가운데 정렬·좌우 여백 적용.
 * 모바일: w-full 만 (기존 풀폭·페이지 내부 padding 유지).
 */
export function MainWidthContainer({ children }: { children: ReactNode }) {
  return <div className="w-full lg:mx-auto lg:max-w-[1280px] lg:px-6">{children}</div>
}
