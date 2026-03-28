'use client'

import axios from 'axios'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchApplicationPublic } from '@/lib/api/applicationPublicVideo'
import { probeChannelVideoPublicAvailable } from '@/lib/api/channelVideoPublic'
import { LAYOUT } from '@/lib/design-tokens'
import { ApplicationVideoDetailClient } from './ApplicationVideoDetailClient'
import { ChannelVideoDetailClient } from './ChannelVideoDetailClient'

function isAxiosNotFound(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 404
}

export function VideoDetailPageClient() {
  const params = useParams()
  const id = typeof params?.applicationId === 'string' ? params.applicationId : ''
  const [mode, setMode] = useState<'loading' | 'channel' | 'application' | 'none'>('loading')

  useEffect(() => {
    if (!id) {
      setMode('none')
      return
    }
    let cancelled = false
    ;(async () => {
      setMode('loading')
      try {
        const isChannel = await probeChannelVideoPublicAvailable(id)
        if (cancelled) return
        if (isChannel) {
          setMode('channel')
          return
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) setMode('none')
        return
      }
      try {
        await fetchApplicationPublic(id)
        if (!cancelled) setMode('application')
      } catch (e2) {
        if (!cancelled) {
          setMode('none')
          if (!isAxiosNotFound(e2)) console.error(e2)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const outer = {
    maxWidth: LAYOUT.containerMaxWidth,
    margin: '0 auto',
    padding: `24px ${LAYOUT.containerPaddingPx}px 80px`,
    paddingTop: 88,
  } as const

  if (!id || mode === 'none') {
    return <div style={outer}>영상을 찾을 수 없습니다.</div>
  }

  if (mode === 'loading') {
    return <div style={outer}>불러오는 중…</div>
  }

  if (mode === 'channel') {
    return <ChannelVideoDetailClient videoId={id} />
  }

  return <ApplicationVideoDetailClient />
}
