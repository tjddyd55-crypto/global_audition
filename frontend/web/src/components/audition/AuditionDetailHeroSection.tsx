'use client'

import { useCallback, useState } from 'react'
import { Link } from '@/i18n.config'
import { AUDITION_DETAIL, HERO } from '@/lib/design-tokens'
import { safeStr } from '@/lib/utils/safe'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

type AuditionDetailHeroSectionProps = {
  auditionId: string
  /** 히어로 표시용 — medium 우선 규칙(폴백은 페이지에서 채움) */
  heroImageMediumUrl: string
  /** 새 탭 원본 보기 — original */
  heroImageOriginalUrl: string
  title: string
  status: string
  /** 있으면 뱃지에 사용(예: "2차 모집 중") */
  statusPillText?: string | null
  tags: string[]
  /** 이미 포맷된 마감일 문자열 */
  endDateFormatted: string
  location: string
  /** 상단 한 줄 설명(상세 본문 첫 줄 등) */
  subtitle?: string | null
  /** 모집 중이며 남은 일수가 3일 이하일 때 마감 임박 표시 */
  deadlineUrgent?: boolean
}

function statusBadgeCopy(status: string): string {
  if (status === 'OPEN') return '모집중 · OPEN'
  if (status === 'CLOSED') return '마감 · CLOSED'
  return '초안 · DRAFT'
}

function statusBadgeClass(status: string): string {
  if (status === 'OPEN') return 'bg-emerald-600 text-white'
  if (status === 'CLOSED') return 'bg-neutral-700 text-white'
  return 'bg-amber-600 text-white'
}

/**
 * 메인 이미지: `.audition-detail-hero-feed-cover` (비율 유지). 좌상단 뱃지 + 하단 오버레이.
 */
export function AuditionDetailHeroSection({
  auditionId,
  heroImageMediumUrl,
  heroImageOriginalUrl,
  title,
  status,
  statusPillText,
  tags,
  endDateFormatted,
  location,
  subtitle,
  deadlineUrgent = false,
}: AuditionDetailHeroSectionProps) {
  const cover = safeStr(heroImageMediumUrl)
  const fullSize = safeStr(heroImageOriginalUrl)
  const [shareHint, setShareHint] = useState<'idle' | 'ok' | 'err'>('idle')
  const [imgFailed, setImgFailed] = useState(false)

  const onShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setShareHint('ok')
      window.setTimeout(() => setShareHint('idle'), 2000)
    } catch {
      setShareHint('err')
      window.setTimeout(() => setShareHint('idle'), 2500)
    }
  }, [])

  const pillLabel = (
    statusPillText != null && String(statusPillText).trim().length > 0
      ? String(statusPillText).trim()
      : statusBadgeCopy(status)
  ).trim()

  const hasCover = cover.length > 0
  const displaySrc = hasCover && !imgFailed ? cover : hasCover ? AUDITION_COVER_PLACEHOLDER_SRC : ''
  const openOriginalHref =
    hasCover && !imgFailed ? (fullSize || cover).trim() : ''

  const safeTitle = safeStr(title)
  const bannerImage = (
    <div className="audition-detail-hero-feed-cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc || AUDITION_COVER_PLACEHOLDER_SRC}
        alt={safeTitle}
        loading="eager"
        decoding="async"
        onError={() => setImgFailed(true)}
      />
    </div>
  )

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative mx-auto w-full lg:max-w-[1280px]">
        <div className="relative w-full overflow-hidden bg-neutral-200 lg:rounded-lg">
          {hasCover ? (
            openOriginalHref.length > 0 ? (
              <a
                href={openOriginalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                {bannerImage}
              </a>
            ) : (
              <div className="w-full">{bannerImage}</div>
            )
          ) : (
            <div
              className="flex w-full items-center justify-center py-24"
              style={{
                background: `linear-gradient(135deg, ${HERO.gradientStart}, ${HERO.gradientEnd})`,
              }}
            >
              <span className="text-sm font-medium text-white/90">대표 이미지 없음</span>
            </div>
          )}
        </div>

        <div
          className={`absolute left-3 top-3 z-[2] rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
        >
          {pillLabel}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-[1] bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-20 text-white">
          <h1
            className="mb-1 text-balance text-xl font-bold leading-snug md:text-2xl"
            style={{ fontWeight: AUDITION_DETAIL.heroTitleWeight }}
          >
            {safeTitle}
          </h1>
          {subtitle != null && String(subtitle).trim().length > 0 ? (
            <p className="mt-1 text-sm text-white/70">{String(subtitle).trim()}</p>
          ) : null}
          {tags.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1.5" aria-label="오디션 태그">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/35 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {deadlineUrgent ? (
              <span className="text-sm font-semibold text-red-500">🔥 마감 임박</span>
            ) : null}
            <p className="m-0 text-sm text-white/80">
              마감 {endDateFormatted} · {safeStr(location)}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white md:text-sm"
              style={{ borderRadius: HERO.buttonRadiusPx }}
            >
              {shareHint === 'ok' ? '복사됨' : shareHint === 'err' ? '실패' : '공유'}
            </button>
            <Link
              href={`/auditions/${auditionId}/vote`}
              className="inline-flex items-center border border-white/40 px-4 py-2 text-xs font-semibold text-white no-underline md:text-sm"
              style={{ borderRadius: HERO.buttonRadiusPx }}
            >
              투표
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
