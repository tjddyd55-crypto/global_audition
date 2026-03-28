'use client'

import axios from 'axios'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchApplicationPublic } from '@/lib/api/applicationPublicVideo'
import { fetchChannelVideoPublic, type ChannelVideoPublicDetail } from '@/lib/api/channelVideoPublic'
import { LAYOUT } from '@/lib/design-tokens'
import { ApplicationVideoDetailClient } from './ApplicationVideoDetailClient'
import { ChannelVideoDetailClient } from './ChannelVideoDetailClient'

function isAxiosNotFound(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 404
}

type RouteState =
  | { kind: 'loading' }
  | { kind: 'none' }
  | { kind: 'channel'; detail: ChannelVideoPublicDetail }
  | { kind: 'application' }

export function VideoDetailPageClient() {
  const params = useParams()
  const id = typeof params?.applicationId === 'string' ? params.applicationId : ''
  const [route, setRoute] = useState<RouteState>({ kind: 'loading' })

  useEffect(() => {
    if (!id) {
      setRoute({ kind: 'none' })
      return
    }
    let cancelled = false
    ;(async () => {
      setRoute({ kind: 'loading' })
      try {
        const detail = await fetchChannelVideoPublic(id)
        if (!cancelled) {
          setRoute({ kind: 'channel', detail })
        }
        return
      } catch (e) {
        if (!isAxiosNotFound(e)) {
          console.error(e)
          if (!cancelled) setRoute({ kind: 'none' })
          return
        }
      }
      try {
        await fetchApplicationPublic(id)
        if (!cancelled) setRoute({ kind: 'application' })
      } catch (e2) {
        if (!cancelled) {
          setRoute({ kind: 'none' })
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

  if (!id || route.kind === 'none') {
    return <div style={outer}>영상을 찾을 수 없습니다.</div>
  }

  if (route.kind === 'loading') {
    return <div style={outer}>불러오는 중…</div>
  }

  if (route.kind === 'channel') {
    return <ChannelVideoDetailClient videoId={id} initialDetail={route.detail} />
  }

  return <ApplicationVideoDetailClient />
}
