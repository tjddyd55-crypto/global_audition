import { MainWidthContainer } from '@/components/layout/MainWidthContainer'

/** (mobile) 그룹도 동일 PC 폭 규칙 — 모바일은 lg 미적용 구간만 사용 */
export default function MobileRouteGroupLayout({ children }: { children: React.ReactNode }) {
  return <MainWidthContainer>{children}</MainWidthContainer>
}
