'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { applicationApi } from '../../../../../lib/api/applications'
import { applicationVideoApi } from '../../../../../lib/api/applicationVideos'

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
    mutationFn: () => applicationVideoApi.create(id, videoUrl.trim()),
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
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>
  }
  if (!applicationQuery.data) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error')}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/my/applications" className="text-blue-600 hover:underline text-sm">← 내 지원서 목록</Link>
          <h1 className="text-2xl font-bold mt-2">{applicationQuery.data.auditionTitle ?? '지원서 상세'}</h1>
          <p className="text-sm text-gray-600">상태: {applicationQuery.data.status}</p>
        </div>

        <div className="bg-white rounded shadow p-4 space-y-3">
          <h2 className="font-semibold">영상 URL 관리</h2>
          <div className="flex gap-2">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={() => createVideoMutation.mutate()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={!videoUrl.trim() || createVideoMutation.isPending}
            >
              추가
            </button>
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <ul className="space-y-2">
            {(videosQuery.data ?? []).map((video) => (
              <li key={video.id} className="flex items-center justify-between border rounded p-2">
                <a href={video.videoUrl} target="_blank" className="text-sm text-blue-600 hover:underline" rel="noreferrer">
                  {video.videoUrl}
                </a>
                <button
                  onClick={() => removeVideoMutation.mutate(video.id)}
                  className="px-2 py-1 text-sm bg-red-600 text-white rounded"
                >
                  삭제
                </button>
              </li>
            ))}
            {(videosQuery.data ?? []).length === 0 && <li className="text-sm text-gray-500">등록된 영상이 없습니다.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
