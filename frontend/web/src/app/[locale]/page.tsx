import { setRequestLocale } from 'next-intl/server'
import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcHomePage from '@/pc/pages/home/HomePage'
import MobileHomePage from '@/mobile/pages/home/HomePage'

/** URL 진입점. PC는 기존 홈을 그대로 쓰고, 모바일은 모바일 메인 디자인을 쓴다. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const device = getDeviceFromHeaders()
  return device === 'mobile' ? <MobileHomePage /> : <PcHomePage />
}
