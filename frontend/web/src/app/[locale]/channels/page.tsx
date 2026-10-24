import { setRequestLocale } from 'next-intl/server'
import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import PcChannelsListPage from '@/pc/pages/channels/ListPage'
import MobileChannelsListPage from '@/mobile/pages/channels/ListPage'

/** 채널 목록 진입점. PC는 기존 화면 그대로, 모바일은 간결한 1열 목록. */
export default async function ChannelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const device = getDeviceFromHeaders()
  return device === 'mobile' ? <MobileChannelsListPage /> : <PcChannelsListPage />
}
