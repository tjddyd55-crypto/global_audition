'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '@/shared/utils/safe'
import { AuditionDetailMediaSection } from '@/components/audition/AuditionDetailMedia'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'
import {
  auditionDetailMediumUrl,
  auditionDetailOriginalUrl,
  auditionHeadlineTitle,
  normalizeAuditionImages,
  PREV_ROUND_APPLY_BLOCKED_MSG,
  type AuditionDto,
} from '@/shared/types/audition'

type MobileAuditionDetailSummaryProps = {
  audition: AuditionDto
  isOpen: boolean
  alreadyApplied: boolean
  applyBlocked: boolean
}

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), 'yyyy.MM.dd', { locale: ko })
  } catch {
    return '-'
  }
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

function MobileDetailSectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
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
}: MobileAuditionDetailSummaryProps) {
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

  const recruitList = safeArr(audition.recruitFields).map((s) => safeStr(s)).filter((s) => s.length > 0)
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
  const pillLabelRaw = audition.recruitmentRoundLabel != null ? String(audition.recruitmentRoundLabel).trim() : ''
  const pillLabel =
    pillLabelRaw.length > 0 ? pillLabelRaw : statusBadgeCopy(status)

  const endDateFormatted = fmtDate(safeStr(audition.endDate))
  const location = safeStr(audition.location)
  const createdAtFormatted = fmtDate(safeStr(audition.createdAt))

  const hasMedium = heroMedium.length > 0
  const [posterFailed, setPosterFailed] = useState(false)
  const posterSrc =
    posterFailed || !hasMedium ? AUDITION_COVER_PLACEHOLDER_SRC : heroMedium
  const posterLinkHref =
    hasMedium && !posterFailed && heroOriginal.length > 0
      ? heroOriginal
      : hasMedium && !posterFailed && heroMedium.length > 0
        ? heroMedium
        : ''

  const PosterInner = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={posterSrc}
      alt=""
      width={1200}
      height={800}
      className="max-h-[min(70vh,520px)] w-full object-cover"
      loading="eager"
      decoding="async"
      onError={() => setPosterFailed(true)}
    />
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="overflow-hidden rounded-2xl bg-gray-100">
        {posterLinkHref.length > 0 ? (
          <a href={posterLinkHref} target="_blank" rel="noopener noreferrer" className="block w-full">
            {PosterInner}
          </a>
        ) : (
          <div className="w-full">{PosterInner}</div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <h1 className="text-balance text-3xl font-bold leading-tight text-gray-950">{headlineTitle}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
            {pillLabel}
          </span>
          {deadlineUrgent ? (
            <span className="text-sm font-semibold text-red-600">🔥 마감 임박</span>
          ) : null}
        </div>

        {auditionTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5" aria-label="태그">
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

        <dl className="grid gap-1 text-sm text-gray-700">
          {location.length > 0 ? (
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="font-medium text-gray-500">위치</dt>
              <dd>{location}</dd>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="font-medium text-gray-500">마감일</dt>
            <dd>{endDateFormatted}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="font-medium text-gray-500">등록일</dt>
            <dd>{createdAtFormatted}</dd>
          </div>
        </dl>
      </div>

      {embed ? (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">소개 영상</h2>
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
      ) : videoHref.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">소개 영상</h2>
          <a
            href={videoHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-violet-700 underline"
          >
            새 창에서 영상 열기
          </a>
        </section>
      ) : null}

      {galleryExtra.length > 0 ? (
        <div className="mt-8">
          <AuditionDetailMediaSection galleryUrls={galleryExtra} />
        </div>
      ) : null}

      {descriptionText.length > 0 ? (
        <MobileDetailSectionCard title="상세 소개">
          <div className="whitespace-pre-line text-[15px] leading-relaxed text-gray-800">{descriptionText}</div>
          <div className="mt-4 text-sm text-gray-600">지원 방법: 영상 업로드 후 간단 정보 입력</div>
        </MobileDetailSectionCard>
      ) : (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600 shadow-sm">
          지원 방법: 영상 업로드 후 간단 정보 입력
        </div>
      )}

      {recruitList.length > 0 ? (
        <MobileDetailSectionCard title="모집 분야">
          <StringListBlock items={recruitList} />
        </MobileDetailSectionCard>
      ) : null}

      {qualificationsList.length > 0 ? (
        <MobileDetailSectionCard title="지원 자격">
          <StringListBlock items={qualificationsList} />
        </MobileDetailSectionCard>
      ) : null}

      {schedulesList.length > 0 ? (
        <MobileDetailSectionCard title="일정">
          <StringListBlock items={schedulesList} />
        </MobileDetailSectionCard>
      ) : null}

      {benefitsList.length > 0 ? (
        <MobileDetailSectionCard title="혜택">
          <StringListBlock items={benefitsList} />
        </MobileDetailSectionCard>
      ) : null}

      {alreadyApplied ? (
        <p className="mt-8 text-sm text-neutral-600">
          이 오디션에 이미 지원하셨습니다. 결과는 마이페이지에서 확인할 수 있어요.
        </p>
      ) : applyBlocked ? (
        <p className="mt-8 text-sm text-amber-800">{audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}</p>
      ) : null}
    </div>
  )
}
