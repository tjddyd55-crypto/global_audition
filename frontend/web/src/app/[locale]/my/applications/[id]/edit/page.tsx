'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../../i18n.config'
import { applicationApi } from '../../../../../../lib/api/applications'
import { applicationVideoApi } from '../../../../../../lib/api/applicationVideos'
import {
  BTN_PRIMARY,
  CARD_BASE,
  INPUT_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { VideoEmbedOverlay } from '@/components/video/VideoEmbedOverlay'
import Image from 'next/image'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { isYoutubeShortsLikeUrl } from '@/lib/utils/videoEmbed'

export default function MyApplicationEditPage() {
  const t = useTranslations('common')
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [videoUrl, setVideoUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [playVideoUrl, setPlayVideoUrl] = useState<string | null>(null)

  const applicationQuery = useQuery({
    queryKey: ['my-application', id],
    queryFn: () => applicationApi.getById(id),
    enabled: !!id,
  })

  const videos = applicationQuery.data?.videos ?? []
  const locked =
    applicationQuery.data?.status === 'ACCEPTED' || applicationQuery.data?.status === 'REJECTED'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <Link href={`/my/applications/${id}`} className="text-sm font-medium text-[#3B82F6] no-underline">
          ← 지원서 보기
        </Link>

        <div className={CARD_BASE}>
          <h1 className={TITLE_PAGE}>지원 수정 · 영상 관리</h1>
          <p className={`${TEXT_SUB} mt-2`}>
            {app.auditionTitle ? `「${app.auditionTitle}」` : '지원서'}에 연결된 영상을 추가하거나 삭제할 수 있습니다.
            기본 정보·자기소개 수정은 별도 정책에 따릅니다.
          </p>
        </div>

        <div className={CARD_BASE}>
          <h2 className={`${TITLE_PAGE} mb-4`}>영상 URL</h2>
          {locked ? (
            <p className="text-sm text-amber-800">검토가 완료된 지원서는 영상을 변경할 수 없습니다.</p>
          ) : (
            <>
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
            </>
          )}

          <p className={`${TEXT_SUB} mb-2 mt-6`}>등록된 영상</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {videos.map((video) => {
              const thumb = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
              const shorts = isYoutubeShortsLikeUrl(video.videoUrl)
              return (
                <li key={video.id} className={`${CARD_BASE} !p-0 overflow-hidden`}>
                  <div className="flex items-stretch gap-0">
                    <button
                      type="button"
                      onClick={() => setPlayVideoUrl(video.videoUrl)}
                      className={
                        shorts
                          ? 'relative aspect-[9/16] w-[120px] shrink-0 bg-neutral-900'
                          : 'relative aspect-video w-[min(44%,200px)] shrink-0 bg-neutral-900'
                      }
                    >
                      {thumb ? (
                        <Image src={thumb} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
                          영상
                        </span>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-white drop-shadow">▶</span>
                      </span>
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {video.title?.trim() ? video.title : 'Audition Video'}
                      </p>
                      {!locked ? (
                        <button
                          type="button"
                          onClick={() => removeVideoMutation.mutate(video.id)}
                          className="self-start rounded-lg border border-red-100 px-3 py-1.5 text-sm text-red-600"
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
            {videos.length === 0 && <li className={TEXT_SUB}>등록된 영상이 없습니다.</li>}
          </ul>
        </div>
      </div>

      <VideoEmbedOverlay videoUrl={playVideoUrl} onClose={() => setPlayVideoUrl(null)} />
    </div>
  )
}
