'use client'

import { VideoListItem } from '@/components/video/VideoListItem'
import type { MyChannelVideoRow } from '@/lib/api/videos'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { formatRelativeKo } from '@/lib/formatRelativeKo'

const BTN_RELOAD =
  'rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50'

export type ChannelPublicVideoListProps = {
  videosLoading: boolean
  videosError: boolean
  displayVideos: MyChannelVideoRow[]
  channelDisplayName: string
  channelProfileImageUrl: string | null
}

/**
 * 공개 채널 영상 목록 — VideoListItem(유튜브형)으로 표시.
 */
export function ChannelPublicVideoList({
  videosLoading,
  videosError,
  displayVideos,
  channelDisplayName,
  channelProfileImageUrl,
}: ChannelPublicVideoListProps) {
  if (videosLoading && displayVideos.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">영상 목록을 불러오는 중…</p>
  }

  if (videosError && displayVideos.length === 0) {
    return (
      <div className="space-y-2 px-4 py-8 text-center">
        <p className="text-sm text-red-600">영상 목록 API를 불러오지 못했습니다.</p>
        <p className="text-xs text-neutral-500">잠시 후 새로고침 하거나, 네트워크를 확인해 주세요.</p>
      </div>
    )
  }

  if (displayVideos.length === 0) {
    return (
      <div className="border-y border-neutral-200 px-3 py-10 text-center">
        <p className="text-base font-semibold text-neutral-900">아직 공개된 영상이 없습니다</p>
        <p className="mt-2 text-sm text-neutral-600">크리에이터가 영상을 공개하면 여기에 표시됩니다.</p>
      </div>
    )
  }

  const chName = channelDisplayName.trim() || '채널'

  return (
    <div className="w-full">
      <div className="flex justify-end px-4 pb-2">
        <button type="button" className={BTN_RELOAD} onClick={() => globalThis.location?.reload()}>
          reload
        </button>
      </div>
      <div>
        {displayVideos.map((v, index) => {
          const thumb = resolveVideoThumbnailUrl(v.videoUrl ?? '', v.thumbnailUrl)
          const cat = v.category?.trim()
          return (
            <div key={v.videoId} className={index > 0 ? 'mt-4' : ''}>
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
    </div>
  )
}
