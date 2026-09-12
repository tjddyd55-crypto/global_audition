'use client'

import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ManageApplicantItem } from '@/shared/api/auditions'
import { BTN_SECONDARY } from '@/shared/ui/specClasses'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { useLocale, useTranslations } from 'next-intl'
import {
  applicantStatusBadgeClass,
  applicantStatusMessageKey,
  nationalityCatalogKey,
} from '../detail/applicantDetailLabels'

function formatCount(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n)
}

function formatAppliedDate(createdAt?: string | null) {
  if (!createdAt) return '—'
  try {
    return format(new Date(createdAt), 'yyyy.MM.dd', { locale: ko })
  } catch {
    return '—'
  }
}

type ApplicantListRowProps = {
  app: ManageApplicantItem
  onOpen: () => void
}

export default function ApplicantListRow({ app, onOpen }: ApplicantListRowProps) {
  const locale = useLocale()
  const tAgency = useTranslations('agency')
  const tApply = useTranslations('apply')
  const tStatus = useTranslations('status')
  const tNat = useTranslations('nationality')
  const tVote = useTranslations('vote')
  const listThumb = resolveVideoThumbnailUrl(app.videoUrl, app.thumbnailUrl)
  const applied = formatAppliedDate(app.createdAt)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40 md:items-center md:gap-4 md:p-4"
    >
      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200 md:h-20 md:w-[4.5rem]">
        {listThumb ? (
          <Image src={listThumb} alt="" fill className="object-cover" sizes="72px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-700/80 to-fuchsia-700/80 text-lg text-white">
            ▶
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-gray-900">{app.name || app.userName || tVote('applicantFallback')}</span>
          <span className="text-sm text-gray-500">
            {app.age != null ? tApply('ageAuto', { age: app.age }) : tAgency('ageUnknown')}
          </span>
          <span className="text-sm text-gray-500">
            {app.nationality ? tNat(nationalityCatalogKey(app.nationality)) : tAgency('nationalityUnknown')}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-semibold text-violet-700">{tAgency('roundApply', { n: app.round })}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>{tAgency('snsCount', { n: formatCount(app.snsCount, locale) })}</span>
          <span>·</span>
          <span>{tAgency('appliedOn', { date: applied })}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${applicantStatusBadgeClass(app.status)}`}>
          {tStatus(applicantStatusMessageKey(app.status))}
        </span>
        <span className={`${BTN_SECONDARY} !w-auto !py-1.5 !text-xs`}>{tAgency('viewRow')}</span>
      </div>
    </button>
  )
}
