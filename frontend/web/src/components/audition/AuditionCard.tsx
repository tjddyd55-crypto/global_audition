'use client'

import { Link } from '../../i18n.config'
import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AuditionDto } from '../../lib/types/audition'
import { FALLBACK_TEXT, DEFAULT_IMAGES } from '../../lib/constants/fallbacks'
import { AUDITION_CARD } from '../../lib/design-tokens'

interface AuditionCardProps {
  audition: AuditionDto
}

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  OPEN: '모집중',
  CLOSED: '마감',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        fontSize: AUDITION_CARD.badgeFontSizePx,
        padding: `${AUDITION_CARD.badgePaddingY}px ${AUDITION_CARD.badgePaddingX}px`,
        borderRadius: AUDITION_CARD.badgeRadius,
        background: AUDITION_CARD.badgeBg,
        color: AUDITION_CARD.badgeColor,
        fontWeight: 500,
      }}
    >
      {statusLabels[status] ?? status}
    </span>
  )
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  if (!audition) return null
  const id = audition?.id ?? ''
  const title = audition?.title ?? FALLBACK_TEXT.videoTitle
  const status = audition?.status ?? 'DRAFT'
  const category = audition?.category ?? ''
  const description = audition?.description ?? ''
  const coverImage = audition?.coverImage ?? ''
  const createdAt = audition?.createdAt
  const dateStr = createdAt
    ? (() => {
        try {
          return format(new Date(createdAt), 'yyyy.MM.dd', { locale: ko })
        } catch {
          return FALLBACK_TEXT.date
        }
      })()
    : FALLBACK_TEXT.date

  return (
    <Link href={`/auditions/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article
        style={{
          background: 'white',
          border: `1px solid ${AUDITION_CARD.borderColor}`,
          borderRadius: AUDITION_CARD.borderRadiusPx,
          padding: AUDITION_CARD.paddingPx,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h3
            style={{
              fontSize: AUDITION_CARD.titleFontSizePx,
              fontWeight: AUDITION_CARD.titleFontWeight,
              margin: 0,
              flex: 1,
              lineHeight: 1.4,
              paddingRight: 8,
            }}
            className="line-clamp-2"
          >
            {title}
          </h3>
          <StatusBadge status={status} />
        </div>

        {category ? (
          <span
            style={{
              fontSize: AUDITION_CARD.categoryFontSizePx,
              border: `1px solid ${AUDITION_CARD.categoryBorderColor}`,
              padding: `${AUDITION_CARD.categoryPaddingY}px ${AUDITION_CARD.categoryPaddingX}px`,
              borderRadius: AUDITION_CARD.categoryRadiusPx,
              display: 'inline-block',
              marginBottom: 12,
            }}
          >
            {category}
          </span>
        ) : null}

        <p
          style={{
            fontSize: AUDITION_CARD.descFontSizePx,
            color: AUDITION_CARD.descColor,
            lineHeight: AUDITION_CARD.descLineHeight,
            margin: '0 0 16px 0',
          }}
          className="line-clamp-2"
        >
          {description || FALLBACK_TEXT.description}
        </p>

        <div
          style={{
            height: AUDITION_CARD.imageHeightPx,
            borderRadius: AUDITION_CARD.imageRadiusPx,
            background: AUDITION_CARD.imageBg,
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <Image
            src={coverImage || DEFAULT_IMAGES.videoThumbnail}
            alt=""
            fill
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        </div>

        <p
          style={{
            fontSize: AUDITION_CARD.dateFontSizePx,
            color: AUDITION_CARD.dateColor,
            textAlign: 'right',
            margin: 0,
          }}
        >
          {dateStr}
        </p>
      </article>
    </Link>
  )
}
