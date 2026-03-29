'use client'

import { useQuery } from '@tanstack/react-query'
import { videoApi, type VideoContent } from '@/lib/api/videos'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { VideoListItem } from '@/components/video/VideoListItem'
import { VideoVisibilitySwitch } from '@/components/channel/VideoVisibilitySwitch'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'
import { TEXT_SUB } from '@/lib/ui/specClasses'
import { formatRelativeKo } from '@/lib/formatRelativeKo'

const BTN_UPLOAD =
  'w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800'

type ChannelMyVideoListProps = {
  loadingLabel: string
  onEdit: (video: VideoContent) => void
  onDelete: (id: string) => void
  onOpenUploadForm: () => void
}

const LIST_CHANNEL_LABEL = '내 채널'

/**
 * 내 채널 영상 목록 — 풀 가로·유튜브 리스트 + 관리 영역.
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
      <div className="px-3 py-10 text-center text-sm font-medium text-neutral-800">{loadingLabel}</div>
    )
  }

  return (
    <div className="w-full">
      {videos && videos.content.length > 0 ? (
        <div className="w-full">
          {videos.content.map((video) => {
            const thumbnailUrl = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
            return (
              <div key={video.id} className="border-b border-neutral-200 last:border-b-0">
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
                    <div className="space-y-2 border-t border-neutral-200 pt-2">
                      {video.description ? (
                        <p className={`${TEXT_SUB} line-clamp-2 text-xs`}>{video.description}</p>
                      ) : null}
                      <VideoVisibilitySwitch video={video} />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(video)}
                          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(video.id)}
                          className="flex-1 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
          <p className={`${TEXT_SUB} mb-3 text-center text-sm`}>등록된 영상이 없습니다</p>
          <button type="button" onClick={onOpenUploadForm} className={BTN_UPLOAD}>
            첫 영상 추가하기
          </button>
        </div>
      )}
    </div>
  )
}
