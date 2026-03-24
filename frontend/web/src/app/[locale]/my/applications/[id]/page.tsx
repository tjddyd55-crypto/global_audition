'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { applicationApi } from '../../../../../lib/api/applications'
import { applicationVideoApi } from '../../../../../lib/api/applicationVideos'
import {
  BTN_PRIMARY,
  CARD_BASE,
  INPUT_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'

function statusBadgeClass(status: string) {
  if (status === 'REVIEWING' || status === 'REVIEWED') return 'rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700'
  if (status === 'ACCEPTED') return 'rounded-full bg-green-50 px-3 py-1 text-sm text-green-700'
  return 'rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
}

function statusLabel(status: string) {
  if (status === 'REVIEWING' || status === 'REVIEWED') return '검토중'
  if (status === 'ACCEPTED') return '합격'
  if (status === 'REJECTED') return '불합격'
  if (status === 'SUBMITTED') return '제출'
  return status
}

export default function MyApplicationDetailPage() {
  const t = useTranslations('common')
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [videoUrl, setVideoUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  /** 재생 오버레이: 페이지 이동 없이 iframe으로만 재생 */
  const [playVideoUrl, setPlayVideoUrl] = useState<string | null>(null)

  const applicationQuery = useQuery({
    queryKey: ['my-application', id],
    queryFn: () => applicationApi.getById(id),
    enabled: !!id,
  })

  const videos = applicationQuery.data?.videos ?? []

  const createVideoMutation = useMutation({
    mutationFn: () => applicationVideoApi.create(id, (videoUrl ?? '').trim()),
    onSuccess: () => {
      setVideoUrl('')
      setErrorMessage(null)
      queryClient.invalidateQueries({ queryKey: ['my-application', id] })
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } }
      setErrorMessage(err?.response?.data?.message ?? '영상 URL 등록에 실패했습니다.')
    },
  })

  const removeVideoMutation = useMutation({
    mutationFn: (videoId: string) => applicationVideoApi.remove(id, videoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-application', id] }),
  })

  if (applicationQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
  }
  if (!applicationQuery.data) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>
  }

  const app = applicationQuery.data
  const playEmbed = playVideoUrl ? getVideoEmbedSrc(playVideoUrl) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <Link href="/my/applications" className="text-sm font-medium text-[#3B82F6] no-underline">
          ← 내 지원서 목록
        </Link>

        <div className={`${CARD_BASE} flex items-center justify-between gap-4`}>
          <div>
            <h1 className={TITLE_PAGE}>{app.auditionTitle ?? '지원서 상세'}</h1>
            <p className={TEXT_SUB}>지원일: {new Date(app.createdAt).toLocaleDateString('ko-KR')}</p>
          </div>
          <span className={statusBadgeClass(app.status)}>{statusLabel(app.status)}</span>
        </div>

        <div className={CARD_BASE}>
          <h2 className={`${TITLE_PAGE} mb-4`}>영상 URL 관리</h2>
          <p className={`${TEXT_SUB} mb-2`}>YouTube URL 추가</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={`${INPUT_BASE} min-w-0 md:flex-1`}
            />
            <button
              type="button"
              onClick={() => createVideoMutation.mutate()}
              disabled={!(videoUrl ?? '').trim() || createVideoMutation.isPending}
              className={BTN_PRIMARY}
            >
              {createVideoMutation.isPending ? '추가 중...' : '+ 추가'}
            </button>
          </div>
          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

          <p className={`${TEXT_SUB} mb-2 mt-6`}>등록된 영상</p>
          <ul className="flex flex-col gap-2">
            {videos.map((video) => (
              <li key={video.id} className={`${CARD_BASE} flex items-center justify-between gap-2`}>
                <button
                  type="button"
                  onClick={() => setPlayVideoUrl(video.videoUrl)}
                  className="min-w-0 flex-1 text-left text-sm font-medium text-[#3B82F6] underline-offset-2 hover:underline"
                >
                  {video.title?.trim() ? video.title : video.videoUrl}
                </button>
                <button
                  type="button"
                  onClick={() => removeVideoMutation.mutate(video.id)}
                  className="shrink-0 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-600"
                >
                  삭제
                </button>
              </li>
            ))}
            {videos.length === 0 && <li className={TEXT_SUB}>등록된 영상이 없습니다.</li>}
          </ul>
        </div>
      </div>

      {playVideoUrl && playEmbed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="영상 재생"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPlayVideoUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPlayVideoUrl(null)}
              className="absolute right-2 top-2 z-10 rounded-lg bg-white/90 px-3 py-1 text-sm font-semibold text-gray-900 shadow"
            >
              닫기
            </button>
            <div className="relative pb-[56.25%]">
              <iframe
                title="등록 영상"
                src={playEmbed}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : playVideoUrl && !playEmbed ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPlayVideoUrl(null)}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-sm text-gray-700">이 URL은 여기에서 임베드할 수 없습니다.</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={playVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white no-underline"
              >
                새 창에서 열기
              </a>
              <button
                type="button"
                onClick={() => setPlayVideoUrl(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
