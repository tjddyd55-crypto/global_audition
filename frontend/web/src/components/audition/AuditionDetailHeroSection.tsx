'use client'

import { useCallback, useState, type MouseEvent } from 'react'
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
  /** 시리즈 2차+ 지원 불가 시 히어로 CTA 비활성 */
  disableHeroApply?: boolean
  heroApplyDisabledReason?: string | null
  tags: string[]
  /** 이미 포맷된 마감일 문자열 */
  endDateFormatted: string
  location: string
  applicantsCount: number
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
 * 모바일 4:5 · PC 16:9 aspect + object-cover(crop), PC만 max-w 1280px 중앙.
 * 좌상단 상태 뱃지 + 하단 그라데이션 오버레이(제목·메타·CTA).
 */
export function AuditionDetailHeroSection({
  auditionId,
  heroImageMediumUrl,
  heroImageOriginalUrl,
  title,
  status,
  statusPillText,
  disableHeroApply = false,
  heroApplyDisabledReason,
  tags,
  endDateFormatted,
  location,
  applicantsCount,
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

  const scrollToApplyBar = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (typeof window === 'undefined') return
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    })
    window.setTimeout(() => {
      document.getElementById('audition-detail-apply')?.focus?.()
    }, 400)
  }, [])

  const isOpen = status === 'OPEN'
  const applicants = applicantsCount.toLocaleString()
  const pillLabel = (
    statusPillText != null && String(statusPillText).trim().length > 0
      ? String(statusPillText).trim()
      : statusBadgeCopy(status)
  ).trim()
  const heroApplyBlocked = Boolean(isOpen && disableHeroApply)

  const hasCover = cover.length > 0
  const displaySrc = hasCover && !imgFailed ? cover : hasCover ? AUDITION_COVER_PLACEHOLDER_SRC : ''
  const openOriginalHref =
    hasCover && !imgFailed ? (fullSize || cover).trim() : ''

  const safeTitle = safeStr(title)
  const bannerImage = (
    <div className="aspect-[4/5] w-full overflow-hidden lg:aspect-[16/9]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc || AUDITION_COVER_PLACEHOLDER_SRC}
        alt={safeTitle}
        className="block h-full w-full object-cover"
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
          <p className="m-0 text-sm text-white/80">
            마감 {endDateFormatted} · {safeStr(location)} · 지원자 {applicants}명
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {isOpen && !heroApplyBlocked ? (
              <a
                href="#audition-detail-apply"
                onClick={scrollToApplyBar}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white no-underline md:text-sm"
                style={{
                  borderRadius: HERO.buttonRadiusPx,
                  background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
                }}
              >
                지원하기
              </a>
            ) : isOpen && heroApplyBlocked ? (
              <span
                className="inline-flex cursor-not-allowed items-center px-4 py-2 text-xs font-semibold text-white/60 md:text-sm"
                title={heroApplyDisabledReason ?? undefined}
                aria-disabled="true"
              >
                지원하기
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white/50 md:text-sm">
                {status === 'CLOSED' ? '마감됨' : '지원 불가'}
              </span>
            )}
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
