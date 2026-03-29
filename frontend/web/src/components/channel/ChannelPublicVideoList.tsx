'use client'

import { VideoListItem } from '@/components/video/VideoListItem'
import type { MyChannelVideoRow } from '@/lib/api/videos'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { formatRelativeKo } from '@/lib/formatRelativeKo'

export type ChannelPublicVideoListProps = {
  videosLoading: boolean
  videosError: boolean
  displayVideos: MyChannelVideoRow[]
  channelDisplayName: string
  channelProfileImageUrl: string | null
}

/**
 * 공개 채널 영상 목록 — 풀 가로·유튜브 리스트형.
 */
export function ChannelPublicVideoList({
  videosLoading,
  videosError,
  displayVideos,
  channelDisplayName,
  channelProfileImageUrl,
}: ChannelPublicVideoListProps) {
  if (videosLoading && displayVideos.length === 0) {
    return <p className="px-3 py-10 text-sm text-neutral-600">영상 목록을 불러오는 중…</p>
  }

  if (videosError && displayVideos.length === 0) {
    return (
      <div className="space-y-1 px-3 py-8">
        <p className="text-sm text-red-600">영상 목록을 불러오지 못했습니다.</p>
        <p className="text-xs text-neutral-600">잠시 후 다시 시도해 주세요.</p>
      </div>
    )
  }

  if (displayVideos.length === 0) {
    return (
      <div className="border-y border-neutral-200 px-3 py-10">
        <p className="text-sm font-medium text-neutral-900">아직 공개된 영상이 없습니다</p>
        <p className="mt-1 text-xs text-neutral-600">크리에이터가 영상을 공개하면 여기에 표시됩니다.</p>
      </div>
    )
  }

  const chName = channelDisplayName.trim() || '채널'

  return (
    <div className="w-full">
      {displayVideos.map((v) => {
        const thumb = resolveVideoThumbnailUrl(v.videoUrl ?? '', v.thumbnailUrl)
        const cat = v.category?.trim()
        return (
          <div key={v.videoId} className="border-b border-neutral-200 last:border-b-0">
            <VideoListItem
              href={`/videos/${v.videoId}`}
              title={v.title}
              thumbnailSrc={thumb}
              channelName={chName}
              channelImageSrc={channelProfileImageUrl}
              viewCount={Number(v.viewCount ?? 0)}
              dateLabel={formatRelativeKo(v.createdAt ?? '')}
              categoryBadge={cat || null}
            />
          </div>
        )
      })}
    </div>
  )
}
