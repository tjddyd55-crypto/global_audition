'use client'

import { useTranslations } from 'next-intl'
import { bilibiliLink } from '@/shared/audition/bilibili'

export function BilibiliOriginalLink({ url, className }: { url?: string | null; className?: string }) {
  const t = useTranslations('video')
  const video = bilibiliLink(url ?? '')
  if (video?.kind !== 'video') return null
  return <a className={className ?? 'inline-block py-2 text-sm underline'} href={video.url} target="_blank" rel="noopener noreferrer">
    {t('openBilibili')}
  </a>
}
