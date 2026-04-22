import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcProfilePage from '@/pc/pages/profile/ProfilePage'
import MobileProfilePage from '@/mobile/pages/profile/ProfilePage'

export default function ProfileRoute() {
  return getDeviceFromHeaders() === 'mobile' ? <MobileProfilePage /> : <PcProfilePage />
}
