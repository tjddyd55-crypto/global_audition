import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcAuditionDetailPage from '@/pc/pages/auditions/DetailPage'
import MobileAuditionDetailPage from '@/mobile/pages/auditions/DetailPage'

export default function AuditionDetailRoute() {
  return getDeviceFromHeaders() === 'mobile' ? <MobileAuditionDetailPage /> : <PcAuditionDetailPage />
}
