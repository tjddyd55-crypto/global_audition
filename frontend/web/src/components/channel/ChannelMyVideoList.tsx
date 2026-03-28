'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { videoApi, type VideoContent } from '@/lib/api/videos'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { VideoVisibilitySwitch } from '@/components/channel/VideoVisibilitySwitch'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'
import { TEXT_SUB } from '@/lib/ui/specClasses'

const CARD_VIDEO =
  'overflow-hidden rounded-2xl border border-violet-100/90 bg-white shadow-[0_4px_24px_-4px_rgba(109,40,217,0.12)]'
const BTN_UPLOAD_PRIMARY =
  'rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-105 active:scale-[0.99]'
const BTN_RELOAD =
  'rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50'

type ChannelMyVideoListProps = {
  loadingLabel: string
  onEdit: (video: VideoContent) => void
  onDelete: (id: string) => void
  onOpenUploadForm: () => void
}

/**
 * 내 채널 영상 목록만 클라이언트 경계로 분리 (Next 서버 컴포넌트 캐시와 무관하게 브라우저에서 항상 최신 조회).
 */
export function ChannelMyVideoList({
  loadingLabel,
  onEdit,
  onDelete,
  onOpenUploadForm,
}: ChannelMyVideoListProps) {
  const { data: videos, isLoading } = useQuery({
    queryKey: channelVideoKeys.mine,
    queryFn: () => videoApi.getMyChannelVideos(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  useEffect(() => {
    console.log('videos', videos)
  }, [videos])

  if (isLoading) {
    return (
      <div className="py-12 text-center text-lg font-semibold text-gray-900">{loadingLabel}</div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={BTN_RELOAD} onClick={() => globalThis.location?.reload()}>
          reload
        </button>
      </div>

      {videos && videos.content.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.content.map((video) => {
            const thumbnailUrl = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
            return (
              <div key={video.id} className={CARD_VIDEO}>
                {thumbnailUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={thumbnailUrl}
                      alt={video.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-violet-50 text-sm text-violet-700/80">
                    썸네일 없음
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{video.title}</h3>
                  </div>
                  {video.category ? (
                    <span className="mb-2 inline-block rounded-full bg-violet-100/90 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                      {video.category}
                    </span>
                  ) : null}
                  {video.description ? <p className={`${TEXT_SUB} mb-2 line-clamp-2`}>{video.description}</p> : null}
                  <div className="mb-3">
                    <VideoVisibilitySwitch video={video} />
                  </div>
                  <div className={`${TEXT_SUB} mb-4 flex flex-col gap-1`}>
                    <span>조회수: {video.viewCount}</span>
                    <span>좋아요: {video.likeCount}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(video)}
                      className="flex-1 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100/80"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(video.id)}
                      className="flex-1 rounded-xl border border-red-100 bg-white px-4 py-2 text-sm font-medium text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-violet-100/90 bg-white p-5 shadow-[0_4px_24px_-4px_rgba(109,40,217,0.12)] sm:p-6">
          <p className={`${TEXT_SUB} mb-4 text-center text-base`}>등록된 영상이 없습니다</p>
          <button
            type="button"
            onClick={onOpenUploadForm}
            className={`${BTN_UPLOAD_PRIMARY} mx-auto flex w-full max-w-xs justify-center`}
          >
            첫 영상 추가하기
          </button>
        </div>
      )}
    </div>
  )
}
