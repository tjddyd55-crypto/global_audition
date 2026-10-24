'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '@/shared/utils/safe'
import { AuditionDetailMediaSection } from '@/components/audition/AuditionDetailMedia'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'
import {
  auditionDetailMediumUrl,
  auditionDetailOriginalUrl,
  auditionHeadlineTitle,
  normalizeAuditionImages,
  type AuditionDto,
} from '@/shared/types/audition'
import { useLocale, useTranslations } from 'next-intl'
import { recruitFieldLabels } from '@/shared/audition/recruitFields'
import { dateFnsLocale } from '@/shared/datetime/dateFnsLocale'
import { applyBlockedDisplayMessage } from '@/shared/audition/applyBlockedCopy'
import { roundStatusLabel } from '@/shared/audition/roundStatusLabel'

type MobileAuditionDetailSummaryProps = {
  audition: AuditionDto
  isOpen: boolean
  alreadyApplied: boolean
  applyBlocked: boolean
  /** 미리보기. 외부 링크를 열지 않는다. */
  readOnly?: boolean
}

function fmtDate(iso: string, locale: string): string {
  try {
    return format(new Date(iso), 'yyyy.MM.dd', { locale: dateFnsLocale(locale) })
  } catch {
    return '-'
  }
}

function statusBadgeCopy(
  status: string,
  t: (key: 'statusOpenBadge' | 'statusClosedBadge' | 'statusDraftBadge') => string,
): string {
  if (status === 'OPEN') return t('statusOpenBadge')
  if (status === 'CLOSED') return t('statusClosedBadge')
  return t('statusDraftBadge')
}

function statusBadgeClass(status: string): string {
  if (status === 'OPEN') return 'bg-emerald-600 text-white'
  if (status === 'CLOSED') return 'bg-neutral-700 text-white'
  return 'bg-amber-600 text-white'
}

function MobileDetailSectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-base font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}

function StringListBlock({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-gray-700">
      {items.map((line, i) => (
        <li key={`${i}-${line.slice(0, 32)}`}>{line}</li>
      ))}
    </ul>
  )
}

export default function MobileAuditionDetailSummary({
  audition,
  isOpen,
  alreadyApplied,
  applyBlocked,
  readOnly = false,
}: MobileAuditionDetailSummaryProps) {
  const t = useTranslations('auditionDetail')
  const tApply = useTranslations('apply')
  const tStatus = useTranslations('status')
  const tRecruit = useTranslations('recruitField')
  const locale = useLocale()
  const embed = getVideoEmbedSrc(safeStr(audition.videoUrl))
  const videoHref = safeStr(audition.videoUrl).trim()

  const galleryRaw = safeArr(audition.galleryImages)
  const imgs = normalizeAuditionImages(audition.images)
  const heroMedium = safeStr(auditionDetailMediumUrl(imgs)).trim()
  const heroOriginal = safeStr(auditionDetailOriginalUrl(imgs)).trim()
  const coverDedupUrls = new Set(
    [imgs.original, imgs.medium, imgs.thumb].map((u) => (u != null ? safeStr(u) : '')).filter(Boolean),
  )
  const galleryExtra = galleryRaw
    .map((src) => safeStr(src))
    .filter((s) => s.length > 0 && !coverDedupUrls.has(s))
    .slice(0, 24)

  const recruitList = recruitFieldLabels(safeArr(audition.recruitFields).map((s) => safeStr(s)), tRecruit)
  const qualificationsList = safeArr(audition.qualifications).map((s) => safeStr(s)).filter((s) => s.length > 0)
  const schedulesList = safeArr(audition.schedules).map((s) => safeStr(s)).filter((s) => s.length > 0)
  const benefitsList = safeArr(audition.benefits).map((s) => safeStr(s)).filter((s) => s.length > 0)
  const auditionTags = safeArr(audition.tags).map((t) => safeStr(t)).filter((t) => t.length > 0)

  const headlineTitle = auditionHeadlineTitle(audition)
  const descriptionText = safeStr(audition.description)
  const heroSubtitle =
    descriptionText
      .split(/\n/)
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? ''

  const remainingDaysVal = safeNum(audition.remainingDays)
  const deadlineUrgent = isOpen && remainingDaysVal <= 3 && remainingDaysVal >= 0

  const status = String(audition.status ?? '')
  const pillLabel =
    status === 'OPEN' || status === 'CLOSED' || status === 'DRAFT'
      ? roundStatusLabel(status, audition.round, tStatus)
      : statusBadgeCopy(status, t)

  const endDateFormatted = fmtDate(safeStr(audition.endDate), locale)
  const location = safeStr(audition.location)
  const createdAtFormatted = fmtDate(safeStr(audition.createdAt), locale)

  // 시드·미등록 공고는 공용 placeholder 경로가 들어온다. 실제 이미지가 없거나 로드 실패면 CSS 플레이스홀더를 쓴다.
  const hasMedium = heroMedium.length > 0 && heroMedium !== AUDITION_COVER_PLACEHOLDER_SRC
  const [posterFailed, setPosterFailed] = useState(false)
  const posterSrc =
    posterFailed || !hasMedium ? AUDITION_COVER_PLACEHOLDER_SRC : heroMedium
  const posterLinkHref =
    hasMedium && !posterFailed && heroOriginal.length > 0
      ? heroOriginal
      : hasMedium && !posterFailed && heroMedium.length > 0
        ? heroMedium
        : ''

  const showFallbackPoster = posterSrc === AUDITION_COVER_PLACEHOLDER_SRC
  const fallbackLabel = recruitList[0] ?? safeStr(audition.agencyName)
  const PosterInner = showFallbackPoster ? (
    <div
      data-testid="audition-poster-fallback"
      className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 text-violet-700"
    >
      <svg aria-hidden className="h-9 w-9 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="9" y="3" width="6" height="11" rx="3" strokeWidth={1.6} />
        <path strokeWidth={1.6} strokeLinecap="round" d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
      </svg>
      {fallbackLabel ? (
        <span className="max-w-[80%] truncate text-xs font-semibold uppercase tracking-wide text-violet-700/80">
          {fallbackLabel}
        </span>
      ) : null}
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={posterSrc}
      alt=""
      width={1200}
      height={800}
      className="aspect-[16/10] max-h-[44vh] w-full object-cover"
      loading="eager"
      decoding="async"
      onError={() => setPosterFailed(true)}
    />
  )

  return (
    <div className="mx-auto max-w-3xl px-4 pb-4 pt-2">
      <div className="overflow-hidden rounded-2xl bg-gray-100">
        {posterLinkHref.length > 0 && !readOnly ? (
          <a href={posterLinkHref} target="_blank" rel="noopener noreferrer" className="block w-full">
            {PosterInner}
          </a>
        ) : (
          <div className="w-full">{PosterInner}</div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <h1 className="text-balance break-keep text-[24px] font-bold leading-[1.25] tracking-tight text-gray-950 [overflow-wrap:anywhere]">{headlineTitle}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>
            {pillLabel}
          </span>
          {deadlineUrgent ? (
            <span className="text-sm font-semibold text-red-600">🔥 {t('deadlineUrgent')}</span>
          ) : null}
        </div>

        {auditionTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5" aria-label={t('tags')}>
            {auditionTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {heroSubtitle.length > 0 ? <p className="text-sm leading-relaxed text-gray-600">{heroSubtitle}</p> : null}

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm text-gray-700">
          {location.length > 0 ? (
            <div className="contents">
              <dt className="font-medium text-gray-500">{t('location')}</dt>
              <dd className="min-w-0 break-words">{location}</dd>
            </div>
          ) : null}
          <div className="contents">
            <dt className="font-medium text-gray-500">{t('endDate')}</dt>
            <dd>{endDateFormatted}</dd>
          </div>
          <div className="contents">
            <dt className="font-medium text-gray-500">{t('registeredAt')}</dt>
            <dd>{createdAtFormatted}</dd>
          </div>
        </dl>
      </div>

      {embed ? (
        <section className="mt-5">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('introVideoTitle')}</h2>
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              title="audition-video"
              src={embed}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : videoHref.length > 0 && !readOnly ? (
        <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('introVideoTitle')}</h2>
          <a
            href={videoHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-violet-700 underline"
          >
            {t('openVideoNew')}
          </a>
        </section>
      ) : null}

      {galleryExtra.length > 0 ? (
        <div className="mt-5">
          <AuditionDetailMediaSection galleryUrls={galleryExtra} />
        </div>
      ) : null}

      {descriptionText.length > 0 ? (
        <MobileDetailSectionCard title={t('introTitle')}>
          <div className="whitespace-pre-line text-[15px] leading-relaxed text-gray-800">{descriptionText}</div>
          <div className="mt-4 text-sm text-gray-600">{t('applyHow')}</div>
        </MobileDetailSectionCard>
      ) : (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600 shadow-sm">
          {t('applyHow')}
        </div>
      )}

      {recruitList.length > 0 ? (
        <MobileDetailSectionCard title={t('recruitFields')}>
          <StringListBlock items={recruitList} />
        </MobileDetailSectionCard>
      ) : null}

      {qualificationsList.length > 0 ? (
        <MobileDetailSectionCard title={t('qualificationsTitle')}>
          <StringListBlock items={qualificationsList} />
        </MobileDetailSectionCard>
      ) : null}

      {schedulesList.length > 0 ? (
        <MobileDetailSectionCard title={t('schedules')}>
          <StringListBlock items={schedulesList} />
        </MobileDetailSectionCard>
      ) : null}

      {benefitsList.length > 0 ? (
        <MobileDetailSectionCard title={t('benefits')}>
          <StringListBlock items={benefitsList} />
        </MobileDetailSectionCard>
      ) : null}

      {alreadyApplied ? (
        <p className="mt-4 text-sm text-neutral-600">
          {t('alreadyAppliedMyPage')}
        </p>
      ) : applyBlocked ? (
        <p className="mt-4 text-sm text-amber-800">
          {applyBlockedDisplayMessage(audition.applyBlockedCode, tApply('prevRoundBlocked'), tApply('failed'))}
        </p>
      ) : null}
    </div>
  )
}
