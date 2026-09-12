'use client'

import { Suspense, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n.config'
import {
  BTN_PRIMARY,
  CARD_BASE,
  INPUT_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'
import { meApplicationRoundsApi } from '@/shared/api/meApplicationRounds'
import { extractMeApiErrorMessage, messageForReasonCode } from '@/shared/audition/reasonMessages'

function MyRoundSubmitContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const applicationId = params.id as string
  const roundId = params.roundId as string
  const auditionIdFromQuery = searchParams.get('auditionId')
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const tApp = useTranslations('application')
  const tMy = useTranslations('myApplications')
  const tErrors = useTranslations('errors')

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
      toast.success(tApp('submitSuccess', { status: st }))
      router.push(`/my/applications/${encodeURIComponent(applicationId)}`)
    },
    onError: (e: unknown) => {
      const code = extractMeApiErrorMessage(e)
      setErrorMessage(messageForReasonCode(code, (key) => tErrors(key as never), tErrors('GENERIC')))
    },
  })

  if (!roundId?.trim()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`${PAGE_CONTAINER} py-6`}>
          <p className="text-sm text-red-600">{tApp('invalidRound')}</p>
          <Link href="/my/applications" className="mt-2 inline-block text-sm text-violet-700 no-underline">
            ← {tMy('backToList')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <Link href={`/my/applications/${encodeURIComponent(applicationId)}`} className="text-sm font-medium text-[#3B82F6] no-underline">
          ← {tMy('backToDetailPage')}
        </Link>

        <div className={CARD_BASE}>
          <h1 className={TITLE_PAGE}>{tApp('submitTitle')}</h1>
          <p className={`${TEXT_SUB} mt-2`}>{tApp('submitHint')}</p>

          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">{tApp('videoUrlYoutube')}</span>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className={INPUT_BASE}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">{tApp('fileUrl')}</span>
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={INPUT_BASE} placeholder="https://..." />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">{tApp('textAnswer')}</span>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                className={`${INPUT_BASE} min-h-[120px]`}
                placeholder={tApp('textPlaceholder')}
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
              {submitMutation.isPending ? tApp('submitting') : tApp('submitNow')}
            </button>
            <Link
              href={`/my/applications/${encodeURIComponent(applicationId)}`}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 no-underline"
            >
              {t('cancel')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyRoundSubmitPage() {
  const tVote = useTranslations('vote')
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">{tVote('loading')}</div>
      }
    >
      <MyRoundSubmitContent />
    </Suspense>
  )
}
