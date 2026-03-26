'use client'

import { Suspense, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n.config'
import {
  BTN_PRIMARY,
  CARD_BASE,
  INPUT_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { meApplicationRoundsApi } from '@/lib/api/meApplicationRounds'
import { extractMeApiErrorMessage, messageForReasonCode } from '@/lib/audition/reasonMessages'

function MyRoundSubmitContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const applicationId = params.id as string
  const roundId = params.roundId as string
  const auditionIdFromQuery = searchParams.get('auditionId')
  const router = useRouter()
  const queryClient = useQueryClient()

  const [videoUrl, setVideoUrl] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [textAnswer, setTextAnswer] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const submitMutation = useMutation({
    mutationFn: () =>
      meApplicationRoundsApi.submit(applicationId, roundId, {
        videoUrl: videoUrl.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        textAnswer: textAnswer.trim() || undefined,
      }),
    onSuccess: async (data) => {
      setErrorMessage(null)
      await queryClient.invalidateQueries({ queryKey: ['my-application', applicationId] })
      await queryClient.invalidateQueries({ queryKey: ['me-round-eligibility'], exact: false })
      await queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey
          if (!Array.isArray(k) || k[0] !== 'audition') return false
          if (auditionIdFromQuery == null || auditionIdFromQuery === '') return true
          return k[1] === auditionIdFromQuery
        },
      })
      const st = data?.submissionStatus ?? 'SUBMITTED'
      toast.success(`영상이 정상적으로 제출되었습니다. 심사 결과를 기다려주세요. (상태: ${st})`)
      router.push(`/my/applications/${encodeURIComponent(applicationId)}`)
    },
    onError: (e: unknown) => {
      const code = extractMeApiErrorMessage(e)
      setErrorMessage(messageForReasonCode(code))
    },
  })

  if (!roundId?.trim()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`${PAGE_CONTAINER} py-6`}>
          <p className="text-sm text-red-600">라운드 정보가 올바르지 않습니다.</p>
          <Link href="/my/applications" className="mt-2 inline-block text-sm text-violet-700 no-underline">
            ← 내 지원서 목록
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <Link href={`/my/applications/${encodeURIComponent(applicationId)}`} className="text-sm font-medium text-[#3B82F6] no-underline">
          ← 지원서 상세
        </Link>

        <div className={CARD_BASE}>
          <h1 className={TITLE_PAGE}>라운드 제출</h1>
          <p className={`${TEXT_SUB} mt-2`}>
            오디션에서 요구하는 유형(영상·파일·텍스트)에 맞게 입력해 주세요. YouTube URL은 videoUrl에 입력합니다.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">영상 URL (YouTube)</span>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className={INPUT_BASE}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">파일 URL</span>
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={INPUT_BASE} placeholder="https://..." />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">텍스트 답변</span>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                className={`${INPUT_BASE} min-h-[120px]`}
                placeholder="텍스트로 제출할 내용"
              />
            </label>
          </div>

          {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? '제출 중...' : '제출하기'}
            </button>
            <Link
              href={`/my/applications/${encodeURIComponent(applicationId)}`}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 no-underline"
            >
              취소
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyRoundSubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">불러오는 중…</div>
      }
    >
      <MyRoundSubmitContent />
    </Suspense>
  )
}
