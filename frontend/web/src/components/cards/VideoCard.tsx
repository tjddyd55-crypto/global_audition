'use client'

import Image from 'next/image'
import { DEFAULT_IMAGES, FALLBACK_TEXT } from '@/shared/constants/fallbacks'
import { AUDITION_CARD, VIDEO_CARD } from '@/shared/design-tokens'

/** 목업·API 공통 카드 입력 (메인·목록 등에서 재사용) */
export type VideoCardModel = {
  id: string
  title: string
  channelName: string
  channelAvatar: string
  thumbnail: string | null
  views: number
  likes: number
  category?: string
}

interface VideoCardProps {
  video: VideoCardModel
  compact?: boolean
}

const safeStr = (v: unknown): string => (v != null && typeof v === 'string' ? v : '')

export default function VideoCard({ video, compact = false }: VideoCardProps) {
  if (!video) return null
  const title = safeStr(video.title)
  const channelName = safeStr(video.channelName)
  const channelAvatar = video?.channelAvatar ?? ''
  const thumbnail = video?.thumbnail ?? null
  const views = Number(video?.views ?? 0)
  const likes = Number(video?.likes ?? 0)
  const category = safeStr(video?.category)

  const cardPadding = compact ? 12 : AUDITION_CARD.paddingPx

  return (
    <article
      style={{
        background: 'white',
        border: `1px solid ${AUDITION_CARD.borderColor}`,
        borderRadius: AUDITION_CARD.borderRadiusPx,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="relative aspect-video w-full shrink-0 overflow-hidden"
        style={{ background: AUDITION_CARD.imageBg }}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title || FALLBACK_TEXT.videoTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <Image
            src={DEFAULT_IMAGES.videoThumbnail}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        )}
        {category ? (
          <span
            style={{
              position: 'absolute',
              top: VIDEO_CARD.badgeTopPx,
              right: VIDEO_CARD.badgeRightPx,
              background: VIDEO_CARD.badgeBg,
              color: 'white',
              fontSize: VIDEO_CARD.badgeFontSizePx,
              padding: `${VIDEO_CARD.badgePaddingY}px ${VIDEO_CARD.badgePaddingX}px`,
              borderRadius: VIDEO_CARD.badgeRadius,
            }}
          >
            {category}
          </span>
        ) : null}
      </div>

      <div style={{ padding: cardPadding, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: VIDEO_CARD.profileGapPx }}>
          {channelAvatar ? (
            <div style={{ position: 'relative', width: VIDEO_CARD.profileSizePx, height: VIDEO_CARD.profileSizePx, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <Image src={channelAvatar} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
          ) : (
            <div style={{ position: 'relative', width: VIDEO_CARD.profileSizePx, height: VIDEO_CARD.profileSizePx, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <Image src={DEFAULT_IMAGES.avatar} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
          )}
          <span style={{ fontSize: 13, color: AUDITION_CARD.descColor }} className="truncate">
            {channelName || FALLBACK_TEXT.channelName}
          </span>
        </div>

        <h3
          style={{
            fontSize: VIDEO_CARD.titleFontSizePx,
            fontWeight: VIDEO_CARD.titleFontWeight,
            margin: 0,
            lineHeight: 1.4,
          }}
          className="line-clamp-2"
        >
          {title || FALLBACK_TEXT.videoTitle}
        </h3>

        <p style={{ fontSize: VIDEO_CARD.metaFontSizePx, color: VIDEO_CARD.metaColor, margin: 0 }}>
          조회 {views.toLocaleString()} · 좋아요 {likes.toLocaleString()}
        </p>
      </div>
    </article>
  )
}
