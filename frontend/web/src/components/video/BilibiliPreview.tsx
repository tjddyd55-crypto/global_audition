'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiClient } from '@/shared/api/client'
import { bilibiliEmbed, bilibiliLink } from '@/shared/audition/bilibili'

export function BilibiliPreview({ value }: { value: string }) {
  const link = bilibiliLink(value)
  return link ? <Preview key={link.url} url={link.url} /> : null
}

function Preview({ url }: { url: string }) {
  const t = useTranslations('video')
  const [resolved, setResolved] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const video = bilibiliLink(resolved)
  return (
    <div className="space-y-2 text-sm text-neutral-600">
      <p>{t('bilibiliDetected')} · {t('bilibiliPublic')}</p>
      {video?.kind === 'video' ? (
        <iframe className="aspect-video w-full max-w-lg rounded border-0" title={t('bilibiliDetected')}
          src={bilibiliEmbed(video)} allow="fullscreen" allowFullScreen />
      ) : (
        <button type="button" className="underline" disabled={busy} onClick={async () => {
          setFailed(false)
          setBusy(true)
          try {
            const direct = bilibiliLink(url)
            if (direct?.kind === 'video') setResolved(direct.url)
            else {
              const response = await apiClient.post<{ url: string }>('/me/video-links/resolve', { url })
              setResolved(response.data.url)
            }
          } catch {
            setFailed(true)
          } finally {
            setBusy(false)
          }
        }}>{busy ? t('preparing') : t('tryPreview')}</button>
      )}
      {failed ? <p role="alert">{t('shortUnavailable')}</p> : null}
    </div>
  )
}
