import { setRequestLocale } from 'next-intl/server'
import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcAuditionsListPage from '@/pc/pages/auditions/ListPage'
import MobileAuditionsListPage from '@/mobile/pages/auditions/ListPage'

/**
 * URL 진입점. 실제 UI는 device에 따라 `src/pc/pages` 또는 `src/mobile/pages`가 담당.
 *
 * - device는 미들웨어가 `x-device` 헤더에 세팅한다.
 * - 모바일 UI가 없는 페이지는 PC 페이지로 폴백하도록 `DevicePicker` 또는 수동 분기 사용.
 */
export default async function AuditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const device = getDeviceFromHeaders()
  return device === 'mobile' ? <MobileAuditionsListPage /> : <PcAuditionsListPage locale={locale} />
}
