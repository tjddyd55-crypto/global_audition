import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcAuditionApplyPage from '@/pc/pages/auditions/ApplyPage'
import MobileAuditionApplyPage from '@/mobile/pages/auditions/ApplyPage'

export default function AuditionApplyRoute() {
  return getDeviceFromHeaders() === 'mobile' ? <MobileAuditionApplyPage /> : <PcAuditionApplyPage />
}
