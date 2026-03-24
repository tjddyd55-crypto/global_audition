'use client'

import { useCallback, useState, type MouseEvent } from 'react'
import { Link } from '@/i18n.config'
import { AUDITION_DETAIL, HERO } from '@/lib/design-tokens'
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

/** PC: 포스터 컬럼 — 꽉 찬 cover (레터박스 없음) */
function DesktopPosterImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed

  return (
    <div className="relative h-[min(70vh,640px)] w-full overflow-hidden bg-neutral-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function statusBadgeCopy(status: string): string {
  if (status === 'OPEN') return '모집중 · OPEN'
  if (status === 'CLOSED') return '마감 · CLOSED'
  return '초안 · DRAFT'
}

/**
 * 모바일: contain 대표 이미지(bg-black) + 하단 그라데이션 위 텍스트/CTA.
 * PC(lg+): 좌측 cover 포스터 + 우측 정보, 블러 배경.
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

  return (
    <section className="relative w-full overflow-hidden">
      {/* ——— 모바일 · contain 히어로(잘림 없음) + 하단 오버레이 UI ——— */}
      <div className="lg:hidden w-full">
        <div className="relative w-full bg-black">
          {cover ? (
            <AuditionDetailHeroImage src={cover} />
          ) : (
            <div
              className="flex min-h-[min(40vh,280px)] w-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${HERO.gradientStart}, ${HERO.gradientEnd})`,
              }}
            >
              <span className="text-sm font-medium text-white/90">대표 이미지 없음</span>
            </div>
          )}
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
              {statusBadgeCopy(status)}
            </span>
            <h1
              className="mb-1 text-balance text-xl font-bold leading-snug"
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
              {isOpen ? (
                <a
                  href="#audition-detail-apply"
                  onClick={scrollToApplyBar}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white no-underline"
                  style={{
                    borderRadius: HERO.buttonRadiusPx,
                    background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
                  }}
                >
                  지원하기
                </a>
              ) : (
                <span className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white/50">
                  {status === 'CLOSED' ? '마감됨' : '지원 불가'}
                </span>
              )}
              <button
                type="button"
                onClick={onShare}
                className="inline-flex items-center border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
                style={{ borderRadius: HERO.buttonRadiusPx }}
              >
                {shareHint === 'ok' ? '복사됨' : shareHint === 'err' ? '실패' : '공유'}
              </button>
              <Link
                href={`/auditions/${auditionId}/vote`}
                className="inline-flex items-center border border-white/40 px-4 py-2 text-xs font-semibold text-white no-underline"
                style={{ borderRadius: HERO.buttonRadiusPx }}
              >
                투표
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
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover object-top opacity-20 blur-3xl md:object-center"
          />
        ) : null}
        <div
          className="relative mx-auto w-full max-w-6xl px-6 py-10"
          style={{ background: 'linear-gradient(180deg, rgba(249,250,251,0.92) 0%, rgba(243,244,246,0.98) 100%)' }}
        >
          <div className="flex w-full items-start gap-8">
            <div className="w-[360px] shrink-0 overflow-hidden">
              {cover ? (
                <DesktopPosterImage src={cover} />
              ) : (
                <div
                  className="flex min-h-[280px] w-full items-center justify-center py-3 text-sm text-white/85"
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
