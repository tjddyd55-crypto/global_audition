'use client'

import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ManageApplicantItem } from '@/shared/api/auditions'
import { BTN_SECONDARY } from '@/shared/ui/specClasses'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import {
  APPLICANT_NATIONALITY_LABEL,
  applicantStatusBadgeClass,
  applicantStatusLabel,
} from '../detail/applicantDetailLabels'

function formatCount(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
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
          <span className="font-semibold text-gray-900">{app.name || app.userName || '지원자'}</span>
          <span className="text-sm text-gray-500">{app.age != null ? `${app.age}세` : '나이 —'}</span>
          <span className="text-sm text-gray-500">
            {app.nationality ? APPLICANT_NATIONALITY_LABEL[app.nationality] ?? app.nationality : '국적 —'}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-semibold text-violet-700">{app.round}차 지원</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>SNS {formatCount(app.snsCount)}</span>
          <span>·</span>
          <span>지원 {applied}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${applicantStatusBadgeClass(app.status)}`}>
          {applicantStatusLabel(app.status)}
        </span>
        <span className={`${BTN_SECONDARY} !w-auto !py-1.5 !text-xs`}>보기</span>
      </div>
    </button>
  )
}
