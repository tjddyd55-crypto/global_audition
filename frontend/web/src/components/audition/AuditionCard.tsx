'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '../../i18n.config'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  auditionHeadlineTitle,
  auditionListImageUrl,
  normalizeAuditionImages,
  type AuditionDto,
} from '@/shared/types/audition'
import { stripImageUrlResizeParams } from '@/shared/utils/imageDisplayUrl'
import { FALLBACK_TEXT, DEFAULT_IMAGES } from '@/shared/constants/fallbacks'

interface AuditionCardProps {
  audition: AuditionDto
}

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  OPEN: '모집중',
  CLOSED: '마감',
}

function statusBadgeClass(status: string): string {
  if (status === 'OPEN') return 'bg-emerald-600 text-white'
  if (status === 'CLOSED') return 'bg-neutral-700 text-white'
  return 'bg-amber-600 text-white'
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  // React Hooks 규칙 준수를 위해 early return 전에 모든 훅을 호출한다.
  // `audition`이 null/undefined인 경우 하단에서 null을 반환하기 전까지 hook 순서가 고정되어야 한다.
  const id = audition?.id ?? ''
  const title = audition
    ? auditionHeadlineTitle(audition).trim() || audition.title.trim() || FALLBACK_TEXT.videoTitle
    : FALLBACK_TEXT.videoTitle
  const status = audition?.status ?? 'DRAFT'
  const statusBadgeLabel =
    status === 'OPEN' && audition?.recruitmentRoundLabel?.trim()
      ? audition.recruitmentRoundLabel.trim()
      : statusLabels[status] ?? status
  const im = normalizeAuditionImages(audition?.images)
  const thumb = (im.thumb ?? '').trim()
  const medium = (im.medium ?? '').trim()
  const original = (im.original ?? '').trim()
  const listPrimary = auditionListImageUrl(im)
  const fallbackImg = DEFAULT_IMAGES.videoThumbnail

  /** 표시·폴백 순서: original → medium → thumb (URL 정규화 후 중복 제거) */
  const coverFallbackChain = useMemo(() => {
    const raw = [original, medium, thumb].map((s) => stripImageUrlResizeParams(s)).filter((s) => s.length > 0)
    return [...new Set(raw)]
  }, [original, medium, thumb])

  const [imgSrc, setImgSrc] = useState(() => listPrimary || fallbackImg)

  useEffect(() => {
    setImgSrc(listPrimary || fallbackImg)
  }, [listPrimary, fallbackImg])

  const onCoverError = useCallback(() => {
    setImgSrc((cur) => {
      const idx = coverFallbackChain.indexOf(cur)
      const next = idx >= 0 ? coverFallbackChain[idx + 1] : null
      return next ?? fallbackImg
    })
  }, [coverFallbackChain, fallbackImg])

  if (!audition) return null

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
  const metaLine = `${dateStr} · ${location}`

  return (
    <Link href={`/auditions/${id}`} className="block w-full text-inherit no-underline">
      <article className="relative w-full overflow-hidden bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={title}
          className="block h-auto w-full max-w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={onCoverError}
        />

        <div
          className={`absolute left-3 top-3 z-[2] rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
        >
          {statusBadgeLabel}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-16">
          <h3 className="pointer-events-none line-clamp-2 text-balance text-lg font-bold leading-snug text-white">
            {title}
          </h3>
          <p className="pointer-events-none mt-1 text-sm text-white/80">{metaLine}</p>
        </div>
      </article>
    </Link>
  )
}
