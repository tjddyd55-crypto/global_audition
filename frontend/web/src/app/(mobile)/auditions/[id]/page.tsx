'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth/authStore'
import {
  auditionHeadlineTitle,
  PREV_ROUND_APPLY_BLOCKED_MSG,
} from '@/lib/types/audition'

export default function AuditionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const myUserId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id, myUserId ?? 'anon'],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  const seriesRound = audition?.round ?? 1
  const applyBlocked =
    audition?.status === 'OPEN' &&
    (role === 'APPLICANT' || role === 'ADMIN') &&
    seriesRound >= 2 &&
    audition?.canApply === false

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">오디션을 찾을 수 없습니다</div>
      </div>
    )
  }

  const heroSubtitle =
    String(audition.description ?? '')
      .split(/\n/)
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? ''
  const rd = Number(audition.remainingDays ?? 0) || 0
  const deadlineUrgent = audition.status === 'OPEN' && rd <= 3 && rd >= 0

  return (
    <div className="min-h-screen pb-24">
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
        <div className="mb-6">
          {applyBlocked ? (
            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-lg bg-black py-3 font-semibold text-white opacity-60"
              title={audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
            >
              지금 지원하기
            </button>
          ) : (
            <Link
              href={`/auditions/${id}/apply`}
              className="mt-3 flex w-full items-center justify-center rounded-lg bg-black py-3 text-center font-semibold text-white no-underline"
            >
              지금 지원하기
            </Link>
          )}
        </div>
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
        {applyBlocked ? (
          <p className="mb-6 text-sm text-amber-800">
            {audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
          </p>
        ) : null}
        <div className="mt-10">
          {applyBlocked ? (
            <button
              type="button"
              disabled
              className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60"
              title={audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
            >
              지금 지원하기
            </button>
          ) : (
            <Link
              href={`/auditions/${id}/apply`}
              className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-lg font-semibold text-white no-underline"
            >
              지금 지원하기
            </Link>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {applyBlocked ? (
          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60"
            title={audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
          >
            지금 지원하기
          </button>
        ) : (
          <Link
            href={`/auditions/${id}/apply`}
            className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-lg font-semibold text-white no-underline"
          >
            지금 지원하기
          </Link>
        )}
      </div>
    </div>
  )
}
