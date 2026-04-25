'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  auditionHeadlineTitle,
  PREV_ROUND_APPLY_BLOCKED_MSG,
  type AuditionDto,
} from '@/shared/types/audition'

type MobileAuditionDetailSummaryProps = {
  audition: AuditionDto
  alreadyApplied: boolean
  applyBlocked: boolean
}

export default function MobileAuditionDetailSummary({
  audition,
  alreadyApplied,
  applyBlocked,
}: MobileAuditionDetailSummaryProps) {
  const heroSubtitle =
    String(audition.description ?? '')
      .split(/\n/)
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? ''
  const rd = Number(audition.remainingDays ?? 0) || 0
  const deadlineUrgent = audition.status === 'OPEN' && rd <= 3 && rd >= 0

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="mb-4 text-3xl font-bold md:text-4xl">{auditionHeadlineTitle(audition)}</h1>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
          {audition.recruitmentRoundLabel ?? audition.status}
        </span>
        {deadlineUrgent ? (
          <span className="text-sm font-semibold text-red-500">🔥 마감 임박</span>
        ) : null}
      </div>
      {heroSubtitle.length > 0 ? (
        <p className="mb-3 text-sm text-gray-500">{heroSubtitle}</p>
      ) : null}
      {audition.description ? (
        <div className="mb-6">
          <p className="whitespace-pre-line text-gray-700">{audition.description}</p>
          <div className="mt-6 text-sm text-gray-600">
            지원 방법: 영상 업로드 후 간단 정보 입력
          </div>
        </div>
      ) : (
        <div className="mb-6 text-sm text-gray-600">
          지원 방법: 영상 업로드 후 간단 정보 입력
        </div>
      )}
      <p className="mb-6 text-sm text-gray-500">
        등록일: {format(new Date(audition.createdAt), 'yyyy.MM.dd', { locale: ko })}
      </p>
      {alreadyApplied ? (
        <p className="mb-6 text-sm text-neutral-500">
          이 오디션에 이미 지원하셨습니다. 결과는 마이페이지에서 확인할 수 있어요.
        </p>
      ) : applyBlocked ? (
        <p className="mb-6 text-sm text-amber-800">
          {audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
        </p>
      ) : null}
    </div>
  )
}
