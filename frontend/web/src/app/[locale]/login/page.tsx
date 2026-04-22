import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcLoginPage from '@/pc/pages/auth/LoginPage'
import MobileLoginPage from '@/mobile/pages/auth/LoginPage'

export default function LoginRoute() {
  return getDeviceFromHeaders() === 'mobile' ? <MobileLoginPage /> : <PcLoginPage />
}
