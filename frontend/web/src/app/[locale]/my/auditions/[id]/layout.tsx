import type { ReactNode } from 'react'
import { PcOnly } from '@/shared/device/PcOnly'

/**
 * 에이전시 오디션 관리 영역(`/my/auditions/[id]/*`) 공용 레이아웃.
 *
 * 이 하위 화면들(관리/지원자 목록/라운드 심사)은 테이블, 다중 컬럼,
 * 일괄 작업 등 데스크톱 조작을 전제로 설계되어 있다.
 * 모바일 접근 시에는 `PcOnly`가 안내 화면으로 대체한다.
 */
export default function AgencyAuditionManageLayout({ children }: { children: ReactNode }) {
  return <PcOnly>{children}</PcOnly>
}
