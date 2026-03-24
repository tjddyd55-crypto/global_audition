'use client'

import { useCallback, useState } from 'react'
import { Link } from '@/i18n.config'
import { AUDITION_CARD, AUDITION_DETAIL, HERO } from '@/lib/design-tokens'
import { safeStr } from '@/lib/utils/safe'
import { AuditionDetailHeroImage } from '@/components/audition/AuditionDetailMedia'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

type AuditionDetailHeroSectionProps = {
  auditionId: string
  coverUrl: string
  title: string
  status: string
  tags: string[]
  /** 이미 포맷된 마감일 문자열 */
  endDateFormatted: string
  location: string
  applicantsCount: number
}

/** PC: 세로 포스터 — 너비만 고정, 비율 유지 (object-cover 금지) */
function DesktopPosterImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="h-auto w-full max-h-[min(85vh,920px)] rounded-xl"
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

function statusBadgeCopy(status: string): string {
  if (status === 'OPEN') return '모집중 · OPEN'
  if (status === 'CLOSED') return '마감 · CLOSED'
  return '초안 · DRAFT'
}

/**
 * 모바일: 기존 풀폭 포스터 + 하단 오버레이 텍스트.
 * PC(lg+): 좌측 고정 폭 포스터 카드 + 우측 정보(가독성), 선택적 블러 배경.
 */
export function AuditionDetailHeroSection({
  auditionId,
  coverUrl,
  title,
  status,
  tags,
  endDateFormatted,
  location,
  applicantsCount,
}: AuditionDetailHeroSectionProps) {
  const cover = safeStr(coverUrl)
  const [shareHint, setShareHint] = useState<'idle' | 'ok' | 'err'>('idle')

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

  const scrollToApplyBar = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
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

  return (
    <section className="relative w-full overflow-hidden">
      {/* ——— 모바일 · 기존 히어로 유지 ——— */}
      <div className="lg:hidden">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-lg min-h-[220px] sm:max-w-xl">
          {cover ? (
            <AuditionDetailHeroImage src={cover} />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${HERO.gradientStart}, ${HERO.gradientEnd})`,
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `rgba(${AUDITION_DETAIL.heroOverlayRgb},${AUDITION_DETAIL.heroOverlayOpacity})`,
            }}
          />
          <div
            className="relative z-[1] mx-auto flex h-full min-h-[220px] w-full max-w-[1200px] flex-col justify-end px-4 md:px-6"
            style={{
              paddingTop: AUDITION_DETAIL.sectionGapPx,
              paddingBottom: AUDITION_DETAIL.sectionGapPx,
              color: AUDITION_DETAIL.heroMetaColor,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: AUDITION_CARD.badgeFontSizePx,
                padding: `${AUDITION_CARD.badgePaddingY}px ${AUDITION_CARD.badgePaddingX}px`,
                borderRadius: AUDITION_CARD.badgeRadius,
                background: AUDITION_DETAIL.statusOpenBg,
                color: AUDITION_DETAIL.statusOpenColor,
                fontWeight: 600,
                marginBottom: AUDITION_DETAIL.heroBadgeMarginBottomPx,
              }}
            >
              {statusBadgeCopy(status)}
            </span>
            <h1
              style={{
                margin: '0 0 16px 0',
                fontSize: `clamp(${AUDITION_DETAIL.heroTitleMinPx}px, 4vw, ${AUDITION_DETAIL.heroTitlePx}px)`,
                fontWeight: AUDITION_DETAIL.heroTitleWeight,
                lineHeight: 1.3,
                color: '#fff',
              }}
            >
              {safeStr(title)}
            </h1>
            {tags.length > 0 ? (
              <div
                className="flex flex-wrap gap-2"
                style={{ marginBottom: 12 }}
                aria-label="오디션 태그"
              >
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/40 bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div
              style={{
                fontSize: AUDITION_DETAIL.heroMetaFontPx,
                display: 'flex',
                flexWrap: 'wrap',
                gap: AUDITION_DETAIL.heroMetaWrapGapPx,
              }}
            >
              <span>마감 {endDateFormatted}</span>
              <span>{safeStr(location)}</span>
              <span>지원자 {applicants}명</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link
                href={`/auditions/${auditionId}/vote`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: HERO.buttonRadiusPx,
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: AUDITION_DETAIL.heroMetaFontPx,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                지원자 보기 &amp; 투표
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ——— PC · 포스터 카드 + 정보 컬럼 ——— */}
      <div className="relative hidden lg:block">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-20 blur-3xl"
          />
        ) : null}
        <div
          className="relative mx-auto w-full max-w-6xl px-6 py-10"
          style={{ background: 'linear-gradient(180deg, rgba(249,250,251,0.92) 0%, rgba(243,244,246,0.98) 100%)' }}
        >
          <div className="flex w-full items-start gap-8">
            <div
              className="w-[360px] shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm"
              style={{ borderColor: AUDITION_DETAIL.cardBorderColor }}
            >
              {cover ? (
                <DesktopPosterImage src={cover} />
              ) : (
                <div
                  className="flex aspect-[3/4] w-full items-center justify-center rounded-xl text-sm text-gray-400"
                  style={{
                    background: `linear-gradient(135deg, ${HERO.gradientStart}, ${HERO.gradientEnd})`,
                  }}
                >
                  대표 이미지 없음
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 py-1">
              <div>
                <span
                  className="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    background:
                      status === 'OPEN'
                        ? '#dcfce7'
                        : status === 'CLOSED'
                          ? '#f3f4f6'
                          : '#fef3c7',
                    color:
                      status === 'OPEN'
                        ? '#15803d'
                        : status === 'CLOSED'
                          ? '#4b5563'
                          : '#b45309',
                  }}
                >
                  {statusBadgeCopy(status)}
                </span>
              </div>

              <h1
                className="text-balance text-3xl font-bold leading-tight text-gray-900 xl:text-4xl"
                style={{ fontWeight: AUDITION_DETAIL.heroTitleWeight }}
              >
                {safeStr(title)}
              </h1>

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2" aria-label="오디션 태그">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="text-base text-gray-600">
                마감 {endDateFormatted}
                <span className="mx-2 text-gray-300">·</span>
                {safeStr(location)}
                <span className="mx-2 text-gray-300">·</span>
                지원자 {applicants}명
              </p>

              <div className="mt-2 flex flex-wrap gap-3">
                {isOpen ? (
                  <a
                    href="#audition-detail-apply"
                    onClick={scrollToApplyBar}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white no-underline"
                    style={{
                      borderRadius: HERO.buttonRadiusPx,
                      background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
                    }}
                  >
                    지원하기
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400"
                  >
                    {status === 'CLOSED' ? '마감됨' : '지원 불가'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  {shareHint === 'ok' ? '링크 복사됨' : shareHint === 'err' ? '복사 실패' : '공유'}
                </button>
                <Link
                  href={`/auditions/${auditionId}/vote`}
                  className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-800 no-underline hover:bg-gray-50"
                  style={{ borderColor: AUDITION_DETAIL.cardBorderColor }}
                >
                  지원자 보기 · 투표
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
