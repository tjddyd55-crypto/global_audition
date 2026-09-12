'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import EmptyState from '@/components/ui/EmptyState'
import { VideoListItem } from '@/components/video/VideoListItem'
import { listBrowsePublicVideos } from '@/shared/api/channelVideoPublic'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { formatRelative } from '@/shared/i18n/formatRelative'
import { useTranslations } from 'next-intl'
import { channelVideoKeys } from '@/shared/query/channelVideoQuery'

const ALL_CATEGORIES_VALUE = ''
const CATEGORIES = [ALL_CATEGORIES_VALUE, 'Vocal', 'Dance', 'Rap'] as const

export function VideosBrowsePageClient() {
  const tRelative = useTranslations('relative')
  const tChannel = useTranslations('channel')
  const tVideo = useTranslations('video')
  const tHome = useTranslations('home')
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [filterCategory, setFilterCategory] = useState<(typeof CATEGORIES)[number]>(ALL_CATEGORIES_VALUE)

  const { data: videos = [], isLoading, isError } = useQuery({
    queryKey: channelVideoKeys.browse(filterCategory || null),
    queryFn: () => listBrowsePublicVideos(filterCategory || undefined),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const sorted = useMemo(() => {
    const list = [...videos]
    return list.sort((a, b) =>
      sortBy === 'latest'
        ? new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
        : (b.viewCount ?? 0) - (a.viewCount ?? 0),
    )
  }, [sortBy, videos])

  return (
    <div className="w-full pb-16 pt-20">
      <div className="px-4 pb-6">
        <h1 className="text-[28px] font-bold leading-tight">{tVideo('browseTitle')}</h1>
        <p className="mt-2 text-base text-neutral-600">{tVideo('browseHint')}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 px-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as (typeof CATEGORIES)[number])}
          className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm sm:flex-none sm:min-w-[160px]"
        >
          {CATEGORIES.map((c) => (
            <option key={c || 'all'} value={c}>
              {c === ALL_CATEGORIES_VALUE ? tVideo('allCategories') : c}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
          className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm sm:flex-none sm:min-w-[120px]"
        >
          <option value="latest">{tVideo('sortLatest')}</option>
          <option value="popular">{tVideo('sortPopular')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-neutral-500">{tVideo('browseLoading')}</div>
      ) : isError ? (
        <div className="border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
          {tHome('videosLoadFailed')}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState message={tVideo('browseEmpty')} />
      ) : (
        <div className="w-full">
          {sorted.map((video, index) => (
            <div key={video.videoId} className={index > 0 ? 'mt-4' : ''}>
              <VideoListItem
                href={`/videos/${video.videoId}`}
                title={video.title}
                thumbnailSrc={resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)}
                channelName={video.channelDisplayName || tChannel('title')}
                channelImageSrc={video.channelProfileImageUrl}
                viewCount={Number(video.viewCount ?? 0)}
                dateLabel={formatRelative(video.publishedAt ?? '', tRelative)}
                categoryBadge={video.category?.trim() || null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
