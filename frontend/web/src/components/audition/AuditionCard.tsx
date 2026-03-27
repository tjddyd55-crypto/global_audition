'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from '../../i18n.config'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  auditionHeadlineTitle,
  auditionListImageUrl,
  normalizeAuditionImages,
  type AuditionDto,
} from '../../lib/types/audition'
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

function StatusBadge({ status, label }: { status: string; label: string }) {
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
      {label}
    </span>
  )
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  if (!audition) return null
  const id = audition?.id ?? ''
  const title =
    auditionHeadlineTitle(audition).trim() || audition.title.trim() || FALLBACK_TEXT.videoTitle
  const status = audition?.status ?? 'DRAFT'
  const statusBadgeLabel =
    status === 'OPEN' && audition?.recruitmentRoundLabel?.trim()
      ? audition.recruitmentRoundLabel.trim()
      : statusLabels[status] ?? status
  const description = audition?.description ?? ''
  const im = normalizeAuditionImages(audition?.images)
  const thumb = (im.thumb ?? '').trim()
  const medium = (im.medium ?? '').trim()
  const original = (im.original ?? '').trim()
  const listPrimary = auditionListImageUrl(im)
  const fallbackImg = DEFAULT_IMAGES.videoThumbnail
  const [imgSrc, setImgSrc] = useState(() => listPrimary || fallbackImg)

  useEffect(() => {
    const p = thumb || medium || original
    setImgSrc(p || fallbackImg)
  }, [thumb, medium, original, fallbackImg])

  const onCoverError = useCallback(() => {
    setImgSrc((cur) => {
      if (cur === thumb && medium) return medium
      if ((cur === thumb || cur === medium) && original) return original
      return fallbackImg
    })
  }, [thumb, medium, original, fallbackImg])

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
          <StatusBadge status={status} label={statusBadgeLabel} />
        </div>

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
          className="mb-3 w-full bg-white"
          style={{
            borderRadius: AUDITION_CARD.imageRadiusPx,
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="block h-auto w-full object-contain"
            loading="lazy"
            decoding="async"
            onError={onCoverError}
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
