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

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{auditionHeadlineTitle(audition)}</h1>
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {audition.recruitmentRoundLabel ?? audition.status}
          </span>
        </div>
        {audition.description && (
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-line">{audition.description}</p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-6">
          등록일: {format(new Date(audition.createdAt), 'yyyy.MM.dd', { locale: ko })}
        </p>
        <div className="mt-8 flex flex-col gap-2">
          {applyBlocked ? (
            <>
              <span
                className="inline-block cursor-not-allowed px-6 py-3 rounded-lg bg-gray-300 text-gray-600 text-center"
                title={audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
              >
                지원하기
              </span>
              <p className="text-sm text-amber-800">
                {audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
              </p>
            </>
          ) : (
            <Link
              href={`/auditions/${id}/apply`}
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
            >
              지원하기
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
