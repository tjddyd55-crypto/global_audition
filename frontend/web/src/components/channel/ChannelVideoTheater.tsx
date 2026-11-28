'use client'

import { EmbeddedVideoFrame } from '@/components/video/EmbeddedVideoFrame'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { MyChannelVideoRow } from '@/shared/api/videos'
import { bumpChannelVideoView } from '@/shared/api/channelVideoPublic'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { formatCount } from '@/shared/money/currency'
import { BilibiliOriginalLink } from '@/components/video/BilibiliOriginalLink'
import { getVideoEmbedSrc, isYoutubeShortsLikeUrl } from '@/shared/utils/videoEmbed'

type Props = {
  videos: MyChannelVideoRow[]
  featuredId?: string | null
  loading?: boolean
  error?: boolean
}

function blockedMessageKey(v: MyChannelVideoRow): 'embedNotFound' | 'embedRestricted' | null {
  if (v.embedStatus === 'NOT_FOUND') return 'embedNotFound'
  if (v.embedStatus === 'RESTRICTED') return 'embedRestricted'
  return null
}

/**
 * 채널 영상: 위에 대표(선택된) 영상 플레이어, 아래 목록(모바일 2열).
 * 플레이어는 썸네일 포스터로 시작해 탭하면 YouTube 임베드를 자동재생한다(전체화면 허용).
 * 조회수는 GLOBAL AUDITION 내부 재생 수이며 YouTube 조회수가 아니다.
 */
export function ChannelVideoTheater({ videos, featuredId, loading, error }: Props) {
  const t = useTranslations('channel')
  const locale = useLocale()
  const ordered = useMemo(() => {
    if (!featuredId) return videos
    const f = videos.find((v) => v.videoId === featuredId)
    return f ? [f, ...videos.filter((v) => v.videoId !== featuredId)] : videos
  }, [videos, featuredId])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const playerRef = useRef<HTMLDivElement | null>(null)
  const selected = ordered.find((v) => v.videoId === selectedId) ?? ordered[0] ?? null

  useEffect(() => {
    setPlaying(false)
  }, [featuredId])

  if (loading && ordered.length === 0) return <p className="px-3 py-10 text-sm text-neutral-600">{t('loadingVideos')}</p>
  if (error && ordered.length === 0) return <p className="px-3 py-8 text-sm text-red-600">{t('videosLoadFailed')}</p>
  if (!selected) {
    return (
      <div className="px-3 py-10">
        <p className="text-sm font-medium text-neutral-900">{t('emptyVideos')}</p>
        <p className="mt-1 text-xs text-neutral-600">{t('emptyVideosHint')}</p>
      </div>
    )
  }

  const play = (v: MyChannelVideoRow) => {
    setSelectedId(v.videoId)
    setPlaying(true)
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (!blockedMessageKey(v)) {
      bumpChannelVideoView(v.videoId)
        .then((r) => setCounts((c) => ({ ...c, [v.videoId]: r.viewCount })))
        .catch(() => undefined)
    }
  }

  const viewsOf = (v: MyChannelVideoRow) => counts[v.videoId] ?? Number(v.viewCount ?? 0)
  const shorts = selected.shorts === true || isYoutubeShortsLikeUrl(selected.videoUrl)
  const blocked = blockedMessageKey(selected)
  const embed = getVideoEmbedSrc(selected.videoUrl, { autoplay: true })
  const thumb = resolveVideoThumbnailUrl(selected.videoUrl ?? '', selected.thumbnailUrl)

  return (
    <div className="w-full" data-testid="channel-video-theater">
      <div ref={playerRef} className="scroll-mt-16">
        <div className={`relative mx-auto w-full overflow-hidden bg-black ${shorts ? 'aspect-[9/16] max-h-[70vh] max-w-[min(100%,420px)]' : 'aspect-video'}`}>
          {blocked ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center text-sm text-white">
              <p>{t(blocked)}</p>
            </div>
          ) : playing && embed ? (
            <EmbeddedVideoFrame
              key={selected.videoId}
              title={selected.title}
              src={embed}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => play(selected)}
              aria-label={selected.title}
              data-testid="channel-player-poster"
              className="group relative block h-full w-full"
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="h-full w-full object-cover opacity-90" />
              ) : null}
              <span className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-2xl text-white group-hover:bg-red-600">
                ▶
              </span>
            </button>
          )}
        </div>
        <BilibiliOriginalLink url={selected.videoUrl} className="mx-3 inline-block pt-2 text-sm underline" />
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2 px-3 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-bold text-neutral-900">{selected.title}</h2>
            <p className="mt-0.5 text-xs text-neutral-500" title={t('viewsInternalHint')}>
              {t('videoViews', { count: formatCount(viewsOf(selected), locale) })}
              {selected.videoId === featuredId ? ` · ${t('featuredTitle')}` : ''}
            </p>
            {selected.description?.trim() ? (
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-neutral-700">{selected.description}</p>
            ) : null}
          </div>
        </div>
      </div>
      {ordered.length > 1 ? (
        <div className="border-t border-neutral-100 px-3 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-neutral-800">{t('allVideos')}</h3>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" data-testid="channel-video-grid">
            {ordered.map((v) => {
              const active = v.videoId === selected.videoId
              const vThumb = resolveVideoThumbnailUrl(v.videoUrl ?? '', v.thumbnailUrl)
              const vShorts = v.shorts === true || isYoutubeShortsLikeUrl(v.videoUrl)
              return (
                <li key={v.videoId} className="min-w-0">
                  <button type="button" onClick={() => play(v)} className="block w-full min-w-0 text-left" data-testid="channel-video-item">
                    <span className={`relative block aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 ${active ? 'ring-2 ring-violet-600' : ''}`}>
                      {vThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={vThumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : null}
                      {vShorts ? (
                        <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{t('shortsBadge')}</span>
                      ) : null}
                      {active && playing ? (
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">{t('playing')}</span>
                      ) : null}
                    </span>
                    <span className="mt-1 line-clamp-2 break-words text-[13px] font-medium leading-snug text-neutral-900">{v.title}</span>
                    <span className="block text-[11px] text-neutral-500">{t('videoViews', { count: formatCount(viewsOf(v), locale) })}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
