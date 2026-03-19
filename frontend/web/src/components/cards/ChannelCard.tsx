'use client'

import Image from 'next/image'
import { Link } from '../../i18n.config'
import type { MockChannel } from '../../lib/mocks/channels'
import { DEFAULT_IMAGES, FALLBACK_TEXT } from '../../lib/constants/fallbacks'
import { AUDITION_CARD, CHANNEL_CARD } from '../../lib/design-tokens'

interface ChannelCardProps {
  channel: MockChannel
}

const safeStr = (v: unknown): string => (v != null && typeof v === 'string' ? v : '')

export default function ChannelCard({ channel }: ChannelCardProps) {
  if (!channel) return null
  const name = safeStr(channel.name)
  const description = safeStr(channel.description)
  const avatar = channel?.avatar ?? ''
  const id = channel?.id ?? ''
  const subscribers = Number(channel?.subscribers ?? 0)
  const videoCount = Number(channel?.videoCount ?? 0)
  const totalViews = Number(channel?.totalViews ?? 0)

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
        구독자 {subscribers.toLocaleString()} · 영상 {videoCount.toLocaleString()} · 조회 {totalViews.toLocaleString()}
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
