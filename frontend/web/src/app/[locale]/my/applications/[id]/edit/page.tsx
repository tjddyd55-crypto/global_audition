'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../../i18n.config'
import { applicationApi } from '@/shared/api/applications'
import { applicationVideoApi } from '@/shared/api/applicationVideos'
import {
  BTN_PRIMARY,
  CARD_BASE,
  INPUT_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'
import { VideoEmbedOverlay } from '@/components/video/VideoEmbedOverlay'
import Image from 'next/image'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { isYoutubeShortsLikeUrl } from '@/shared/utils/videoEmbed'

export default function MyApplicationEditPage() {
  const t = useTranslations('common')
  const tMy = useTranslations('myApplications')
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
      setErrorMessage(err?.response?.data?.message ?? tMy('videoRegisterFailed'))
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
          ← {tMy('backToDetail')}
        </Link>

        <div className={CARD_BASE}>
          <h1 className={TITLE_PAGE}>{tMy('editTitle')}</h1>
          <p className={`${TEXT_SUB} mt-2`}>
            {app.auditionTitle
              ? tMy('editHintNamed', { title: app.auditionTitle })
              : tMy('editHint')}
          </p>
        </div>

        <div className={CARD_BASE}>
          <h2 className={`${TITLE_PAGE} mb-4`}>{tMy('videoUrl')}</h2>
          {locked ? (
            <p className="text-sm text-amber-800">{tMy('lockedVideos')}</p>
          ) : (
            <>
              <p className={`${TEXT_SUB} mb-2`}>{tMy('addYoutube')}</p>
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
                  {createVideoMutation.isPending ? tMy('adding') : tMy('addPlus')}
                </button>
              </div>
              {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
            </>
          )}

          <p className={`${TEXT_SUB} mb-2 mt-6`}>{tMy('registeredVideos')}</p>
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
                          {tMy('video')}
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
                          {t('delete')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
            {videos.length === 0 && <li className={TEXT_SUB}>{tMy('noVideos')}</li>}
          </ul>
        </div>
      </div>

      <VideoEmbedOverlay videoUrl={playVideoUrl} onClose={() => setPlayVideoUrl(null)} />
    </div>
  )
}
