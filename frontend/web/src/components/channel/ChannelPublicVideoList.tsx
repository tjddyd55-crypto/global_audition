'use client'

import { VideoListItem } from '@/components/video/VideoListItem'
import type { MyChannelVideoRow } from '@/shared/api/videos'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { formatRelativeKo } from '@/shared/formatRelativeKo'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('channel')
  if (videosLoading && displayVideos.length === 0) {
    return <p className="px-3 py-10 text-sm text-neutral-600">{t('loadingVideos')}</p>
  }

  if (videosError && displayVideos.length === 0) {
    return (
      <div className="space-y-1 px-3 py-8">
        <p className="text-sm text-red-600">{t('videosLoadFailed')}</p>
        <p className="text-xs text-neutral-600">{t('retryLater')}</p>
      </div>
    )
  }

  if (displayVideos.length === 0) {
    return (
      <div className="border-y border-neutral-200 px-3 py-10">
        <p className="text-sm font-medium text-neutral-900">{t('emptyVideos')}</p>
        <p className="mt-1 text-xs text-neutral-600">{t('emptyVideosHint')}</p>
      </div>
    )
  }

  const chName = channelDisplayName.trim() || t('title')

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
