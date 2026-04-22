import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcRegisterPage from '@/pc/pages/auth/RegisterPage'
import MobileRegisterPage from '@/mobile/pages/auth/RegisterPage'

export default function RegisterRoute() {
  return getDeviceFromHeaders() === 'mobile' ? <MobileRegisterPage /> : <PcRegisterPage />
}
