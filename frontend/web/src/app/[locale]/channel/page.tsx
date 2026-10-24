'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n.config'

/** 레거시 경로 — 채널 스튜디오는 `/my/channel` 로 통일 */
export default function ChannelLegacyRedirectPage() {
  const tCommon = useTranslations('common')
  const router = useRouter()
  useEffect(() => {
    router.replace('/my/channel')
  }, [router])
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center px-3 text-sm text-neutral-600">
      {tCommon('redirecting')}
    </div>
  )
}
