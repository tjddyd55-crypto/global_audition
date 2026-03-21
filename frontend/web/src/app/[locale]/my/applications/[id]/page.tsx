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

function statusBadgeClass(status: string) {
  if (status === 'REVIEWED') return 'rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700'
  if (status === 'ACCEPTED') return 'rounded-full bg-green-50 px-3 py-1 text-sm text-green-700'
  return 'rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
}

function statusLabel(status: string) {
  if (status === 'REVIEWED') return '검토중'
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

  const applicationQuery = useQuery({
    queryKey: ['my-application', id],
    queryFn: () => applicationApi.getById(id),
    enabled: !!id,
  })
  const videosQuery = useQuery({
    queryKey: ['my-application-videos', id],
    queryFn: () => applicationVideoApi.list(id),
    enabled: !!id,
  })

  const createVideoMutation = useMutation({
    mutationFn: () => applicationVideoApi.create(id, (videoUrl ?? '').trim()),
    onSuccess: () => {
      setVideoUrl('')
      setErrorMessage(null)
      queryClient.invalidateQueries({ queryKey: ['my-application-videos', id] })
    },
    onError: (e: any) => setErrorMessage(e?.response?.data?.message ?? '영상 URL 등록에 실패했습니다.'),
  })

  const removeVideoMutation = useMutation({
    mutationFn: (videoId: string) => applicationVideoApi.remove(videoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-application-videos', id] }),
  })

  if (applicationQuery.isLoading || videosQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
  }
  if (!applicationQuery.data) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>
  }

  const app = applicationQuery.data

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
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={`${INPUT_BASE} md:flex-1`}
            />
            <button
              type="button"
              onClick={() => createVideoMutation.mutate()}
              disabled={!(videoUrl ?? '').trim() || createVideoMutation.isPending}
              className={BTN_PRIMARY}
            >
              + 추가
            </button>
          </div>
          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}

          <p className={`${TEXT_SUB} mb-2 mt-6`}>등록된 영상</p>
          <ul className="flex flex-col gap-2">
            {(videosQuery.data ?? []).map((video) => (
              <li key={video.id} className={`${CARD_BASE} flex items-center justify-between gap-2`}>
                <a href={video.videoUrl} target="_blank" className="text-sm text-[#3B82F6] no-underline" rel="noreferrer">
                  {video.videoUrl}
                </a>
                <button
                  type="button"
                  onClick={() => removeVideoMutation.mutate(video.id)}
                  className="shrink-0 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-600"
                >
                  삭제
                </button>
              </li>
            ))}
            {(videosQuery.data ?? []).length === 0 && <li className={TEXT_SUB}>등록된 영상이 없습니다.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
