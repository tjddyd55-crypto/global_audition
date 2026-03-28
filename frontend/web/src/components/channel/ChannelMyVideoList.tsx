'use client'

import { useQuery } from '@tanstack/react-query'
import { videoApi, type VideoContent } from '@/lib/api/videos'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { VideoListItem } from '@/components/video/VideoListItem'
import { VideoVisibilitySwitch } from '@/components/channel/VideoVisibilitySwitch'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'
import { TEXT_SUB } from '@/lib/ui/specClasses'
import { formatRelativeKo } from '@/lib/formatRelativeKo'

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

const LIST_CHANNEL_LABEL = '내 채널'

/**
 * 내 채널 영상 목록 — VideoListItem + 하단 관리 영역.
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

  if (isLoading) {
    return (
      <div className="py-12 text-center text-lg font-semibold text-gray-900">{loadingLabel}</div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2 px-3">
        <button type="button" className={BTN_RELOAD} onClick={() => globalThis.location?.reload()}>
          reload
        </button>
      </div>

      {videos && videos.content.length > 0 ? (
        <div className="w-full">
          {videos.content.map((video, index) => {
            const thumbnailUrl = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
            return (
              <div key={video.id} className={index > 0 ? 'mt-4' : ''}>
                <VideoListItem
                  href={`/videos/${video.id}`}
                  title={video.title}
                  thumbnailSrc={thumbnailUrl}
                  channelName={LIST_CHANNEL_LABEL}
                  channelImageSrc={null}
                  viewCount={Number(video.viewCount ?? 0)}
                  dateLabel={formatRelativeKo(video.createdAt ?? '')}
                  categoryBadge={video.category?.trim() || null}
                  footer={
                    <div className="space-y-3 border-t border-neutral-100 pt-3">
                      {video.description ? (
                        <p className={`${TEXT_SUB} line-clamp-2 text-xs`}>{video.description}</p>
                      ) : null}
                      <VideoVisibilitySwitch video={video} />
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
                  }
                />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border-y border-neutral-200 px-3 py-8">
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
