'use client'

import { EmbeddedVideoFrame } from '@/components/video/EmbeddedVideoFrame'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { getVideoEmbedSrc, isYoutubeShortsLikeUrl } from '@/shared/utils/videoEmbed'
import { bilibiliLink } from '@/shared/audition/bilibili'
import { BilibiliOriginalLink } from '@/components/video/BilibiliOriginalLink'

type Props = {
  videoUrl?: string | null
  thumbnailUrl?: string | null
  title: string
  playing: boolean
  onPlay: () => void
  /** 목록 카드는 조금 낮게, 공유 랜딩은 크게 */
  compact?: boolean
}

/**
 * 썸네일만 먼저 보여 주고, 탭하면 페이지 안에서 재생한다.
 * 자동재생은 하지 않는다(탭 후에만 iframe 을 넣는다). 쇼츠는 9:16.
 */
export function VoteInlineVideo({ videoUrl, thumbnailUrl, title, playing, onPlay, compact }: Props) {
  const embed = getVideoEmbedSrc(videoUrl ?? '', playing ? { autoplay: true } : undefined)
  const shorts = isYoutubeShortsLikeUrl(videoUrl ?? '')
  const thumb = resolveVideoThumbnailUrl(videoUrl ?? '', thumbnailUrl)
  const bilibili = bilibiliLink(videoUrl ?? '')?.kind === 'video'
  const frame = shorts
    ? compact
      ? 'mx-auto aspect-[9/16] max-h-[22rem] w-full max-w-[16rem]'
      : 'mx-auto aspect-[9/16] max-h-[70vh] max-w-sm'
    : 'aspect-video w-full'

  if (playing && embed) {
    return (
      <>
      <div className={`relative bg-black ${frame}`} data-testid="vote-inline-video">
        <EmbeddedVideoFrame
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      {bilibili ? <BilibiliOriginalLink url={videoUrl} /> : null}
      </>
    )
  }

  const canPlay = Boolean(embed)
  return (
    <div className={`relative bg-black ${frame}`} data-testid="vote-inline-video">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gray-800 p-2 text-xs text-white">{bilibili ? 'Bilibili' : null}</div>
      )}
      {canPlay ? (
        <button
          type="button"
          onClick={onPlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={title}
          data-testid="vote-inline-play"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-2xl text-white" aria-hidden>
            ▶
          </span>
        </button>
      ) : null}
    </div>
  )
}
