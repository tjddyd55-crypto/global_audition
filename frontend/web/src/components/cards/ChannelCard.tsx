'use client'

import Image from 'next/image'
import { Link } from '../../i18n.config'
import type { PublicChannelListItem } from '@/shared/api/channel'
import { DEFAULT_IMAGES, FALLBACK_TEXT } from '@/shared/constants/fallbacks'
import { AUDITION_CARD, CHANNEL_CARD } from '@/shared/design-tokens'

interface ChannelCardProps {
  channel: PublicChannelListItem
}

const safeStr = (v: unknown): string => (v != null && typeof v === 'string' ? v : '')

export default function ChannelCard({ channel }: ChannelCardProps) {
  if (!channel) return null
  const name = safeStr(channel.nickname)
  const description = safeStr(channel.introText)
  const avatar = channel.profileImage?.trim() ?? ''
  const id = channel.userId
  const subscribers = Number(channel.subscriberCount ?? 0)
  const videoCount = Number(channel.videoCount ?? 0)

  return (
    <article
      style={{
        background: 'white',
        border: `1px solid ${AUDITION_CARD.borderColor}`,
        borderRadius: AUDITION_CARD.borderRadiusPx,
        padding: CHANNEL_CARD.cardPaddingPx,
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ margin: '0 auto', width: CHANNEL_CARD.profileSizePx, height: CHANNEL_CARD.profileSizePx, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
        {avatar ? (
          <Image src={avatar} alt={name || FALLBACK_TEXT.channelName} fill style={{ objectFit: 'cover' }} unoptimized />
        ) : (
          <Image src={DEFAULT_IMAGES.avatar} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
        )}
      </div>

      <h3
        style={{
          marginTop: CHANNEL_CARD.nameMarginTopPx,
          fontWeight: CHANNEL_CARD.nameFontWeight,
          fontSize: CHANNEL_CARD.nameFontSizePx,
          marginBottom: 0,
        }}
      >
        {name || FALLBACK_TEXT.channelName}
      </h3>

      <p
        style={{
          fontSize: CHANNEL_CARD.descFontSizePx,
          color: CHANNEL_CARD.descColor,
          marginTop: CHANNEL_CARD.descMarginTopPx,
          marginBottom: 0,
          lineHeight: 1.4,
        }}
        className="line-clamp-2"
      >
        {description || FALLBACK_TEXT.description}
      </p>

      <div
        style={{
          marginTop: CHANNEL_CARD.statsMarginTopPx,
          fontSize: CHANNEL_CARD.statsFontSizePx,
          color: CHANNEL_CARD.statsColor,
        }}
      >
        구독자 {subscribers.toLocaleString()} · 영상 {videoCount.toLocaleString()}
      </div>

      <Link
        href={`/channel/${id}`}
        style={{
          marginTop: CHANNEL_CARD.buttonMarginTopPx,
          fontSize: CHANNEL_CARD.buttonFontSizePx,
          color: CHANNEL_CARD.buttonColor,
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        채널 보기 →
      </Link>
    </article>
  )
}
