'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import EmptyState from '@/components/ui/EmptyState'
import { VideoListItem } from '@/components/video/VideoListItem'
import { listBrowsePublicVideos } from '@/lib/api/channelVideoPublic'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { formatRelativeKo } from '@/lib/formatRelativeKo'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'

const CATEGORIES = ['전체 카테고리', 'Vocal', 'Dance', 'Rap'] as const

export function VideosBrowsePageClient() {
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [filterCategory, setFilterCategory] = useState<(typeof CATEGORIES)[number]>('전체 카테고리')

  const { data: videos = [], isLoading, isError } = useQuery({
    queryKey: channelVideoKeys.browse(filterCategory === '전체 카테고리' ? null : filterCategory),
    queryFn: () => listBrowsePublicVideos(filterCategory),
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
        <h1 className="text-[28px] font-bold leading-tight">영상 둘러보기</h1>
        <p className="mt-2 text-base text-neutral-600">실제 공개 영상이 최신 상태로 반영됩니다</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 px-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as (typeof CATEGORIES)[number])}
          className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm sm:flex-none sm:min-w-[160px]"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
          className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm sm:flex-none sm:min-w-[120px]"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-neutral-500">영상을 불러오는 중…</div>
      ) : isError ? (
        <div className="border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
          영상 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState message="아직 업로드된 공개 영상이 없습니다" />
      ) : (
        <div className="w-full">
          {sorted.map((video, index) => (
            <div key={video.videoId} className={index > 0 ? 'mt-4' : ''}>
              <VideoListItem
                href={`/videos/${video.videoId}`}
                title={video.title}
                thumbnailSrc={resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)}
                channelName={video.channelDisplayName || '채널'}
                channelImageSrc={video.channelProfileImageUrl}
                viewCount={Number(video.viewCount ?? 0)}
                dateLabel={formatRelativeKo(video.publishedAt ?? '')}
                categoryBadge={video.category?.trim() || null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
