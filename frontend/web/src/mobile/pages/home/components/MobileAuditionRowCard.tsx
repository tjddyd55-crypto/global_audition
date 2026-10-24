'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { dateFnsLocale } from '@/shared/datetime/dateFnsLocale'
import { DEFAULT_IMAGES } from '@/shared/constants/fallbacks'
import { devAuditionThumbnail } from '../devAssets'
import { auditionHeadlineTitle, auditionListImageUrl, type AuditionDto } from '@/shared/types/audition'

type Props = {
  audition: AuditionDto
  /** 추천 섹션에서는 상태 대신 '추천' 배지를 쓴다. */
  badge?: 'status' | 'recommended'
}

function formatDay(value: string | null | undefined, locale: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return format(date, 'yyyy.MM.dd', { locale: dateFnsLocale(locale) })
}

/** 모바일 메인 공고 카드: 한 줄 1개, 왼쪽 썸네일 / 오른쪽 정보. */
export default function MobileAuditionRowCard({ audition, badge = 'status' }: Props) {
  const tStatus = useTranslations('status')
  const tHome = useTranslations('home')
  const tFallback = useTranslations('fallback')
  const locale = useLocale()
  const primary = auditionListImageUrl(audition.images)
  // 실제 썸네일이 없을 때만 DEV 더미 이미지(id 기반 결정적) 사용
  const fallback = devAuditionThumbnail(audition.id)
  const [imgSrc, setImgSrc] = useState(primary || fallback)
  useEffect(() => setImgSrc(primary || fallback), [primary, fallback])

  const title = auditionHeadlineTitle(audition).trim() || tFallback('videoTitle')
  const status = String(audition.status ?? '')
  const statusLabel =
    status === 'OPEN'
      ? audition.recruitmentRoundLabel?.trim() || tStatus('open')
      : status === 'CLOSED'
        ? tStatus('closed')
        : tStatus('draft')
  const badgeLabel = badge === 'recommended' ? tHome('recommendedBadge') : statusLabel
  const badgeClass =
    badge === 'recommended' ? 'bg-violet-600' : status === 'OPEN' ? 'bg-emerald-600' : 'bg-neutral-700'
  const start = formatDay(audition.startDate, locale)
  const end = formatDay(audition.endDate || audition.deadlineAt, locale)
  const dates = start && end ? `${start} ~ ${end}` : start || end
  const agency = audition.agencyName?.trim()
  const location = audition.location?.trim()

  return (
    <Link
      href={`/auditions/${audition.id}`}
      data-testid="mobile-audition-card"
      className="flex min-w-0 items-stretch overflow-hidden rounded-xl border border-neutral-200 bg-white text-inherit no-underline shadow-sm"
    >
      <div className="relative w-[38%] max-w-[168px] shrink-0 bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgSrc((cur) => (cur === fallback ? DEFAULT_IMAGES.videoThumbnail : fallback))}
        />
        <span
          className={`absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1 py-3 pl-3 pr-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-snug text-neutral-900">{title}</h3>
          {agency ? <p className="mt-1 truncate text-xs text-neutral-500">{agency}</p> : null}
          {location ? <p className="mt-0.5 truncate text-xs text-neutral-500">{location}</p> : null}
          {dates ? <p className="mt-0.5 truncate text-xs text-neutral-500">{dates}</p> : null}
        </div>
        <svg aria-hidden className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
