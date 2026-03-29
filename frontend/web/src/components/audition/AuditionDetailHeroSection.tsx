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

/**
 * 풀폭 대표 이미지(원본 세로 비율, w-full h-auto) + 하단 그라데이션 위 제목·상태·CTA.
 * 소개 영상만 16:9 유지(페이지 하단 섹션).
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

  const bannerImage = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc || AUDITION_COVER_PLACEHOLDER_SRC}
      alt=""
      className="block w-full h-auto object-cover"
      loading="eager"
      decoding="async"
      onError={() => setImgFailed(true)}
    />
  )

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full">
        <div className="relative w-full bg-neutral-200">
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
          className="pointer-events-none absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-4 left-4 right-4 z-[1] text-white">
          <span
            className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              status === 'OPEN'
                ? 'bg-green-100 text-green-800'
                : status === 'CLOSED'
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-amber-100 text-amber-900'
            }`}
          >
            {pillLabel}
          </span>
          <h1
            className="mb-1 text-balance text-xl font-bold leading-snug md:text-2xl"
            style={{ fontWeight: AUDITION_DETAIL.heroTitleWeight }}
          >
            {safeStr(title)}
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
          <p className="m-0 text-sm opacity-90">
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
