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
import { safeNum } from '../../lib/utils/safe'
import { FALLBACK_TEXT, DEFAULT_IMAGES } from '../../lib/constants/fallbacks'

interface AuditionCardProps {
  audition: AuditionDto
}

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  OPEN: '모집중',
  CLOSED: '마감',
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  if (!audition) return null
  const id = audition?.id ?? ''
  const title =
    auditionHeadlineTitle(audition).trim() || audition.title.trim() || FALLBACK_TEXT.videoTitle
  const status = audition?.status ?? 'DRAFT'
  const statusMeta =
    status === 'OPEN' && audition?.recruitmentRoundLabel?.trim()
      ? audition.recruitmentRoundLabel.trim()
      : statusLabels[status] ?? status
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

  const location = (audition?.location ?? '').trim() || '—'
  const applicants = safeNum(audition?.applicantsCount).toLocaleString()
  const metaLine = `${statusMeta} · ${dateStr} · ${location} · 지원자 ${applicants}명`

  return (
    <Link href={`/auditions/${id}`} className="block w-full text-inherit no-underline">
      <article className="w-full">
        <div className="aspect-video w-full overflow-hidden bg-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={onCoverError}
          />
        </div>
        <div className="px-4 py-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{metaLine}</p>
        </div>
      </article>
    </Link>
  )
}
