'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@/i18n.config'
import EmptyState from '@/components/ui/EmptyState'
import { listBrowsePublicVideos } from '@/lib/api/channelVideoPublic'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { DEFAULT_IMAGES } from '@/lib/constants/fallbacks'
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
      <div className="px-3 pb-6">
        <h1 className="text-[28px] font-bold leading-tight">영상 둘러보기</h1>
        <p className="mt-2 text-base text-neutral-600">실제 공개 영상이 최신 상태로 반영됩니다</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 px-3">
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
        <div className="border border-red-100 bg-red-50 px-3 py-8 text-center text-sm text-red-600">
          영상 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState message="아직 업로드된 공개 영상이 없습니다" />
      ) : (
        <div>
          {sorted.map((video, index) => {
            const thumbnail = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
            const meta = [
              video.channelDisplayName || '채널',
              `${Number(video.viewCount ?? 0).toLocaleString('ko-KR')}회`,
              formatRelativeKo(video.publishedAt ?? ''),
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <article key={video.videoId} className={index > 0 ? 'mt-5 md:mt-6' : ''}>
                <Link href={`/videos/${video.videoId}`} className="block">
                  <div className="relative w-full overflow-hidden bg-black aspect-video">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full min-h-[10rem] items-center justify-center text-sm text-neutral-500">
                        썸네일 없음
                      </div>
                    )}
                    {video.category ? (
                      <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                        {video.category}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="flex items-start gap-3 px-3 py-2">
                  <Link
                    href={`/videos/${video.videoId}`}
                    className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200"
                    aria-label={`${video.channelDisplayName || '채널'} 프로필`}
                  >
                    {video.channelProfileImageUrl ? (
                      <Image src={video.channelProfileImageUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <Image src={DEFAULT_IMAGES.avatar} alt="" fill className="object-cover" unoptimized />
                    )}
                  </Link>
                  <Link
                    href={`/videos/${video.videoId}`}
                    className="min-w-0 flex-1 text-inherit no-underline"
                    aria-label={video.title}
                  >
                    <div className="text-sm font-semibold leading-snug text-neutral-900 line-clamp-2">{video.title}</div>
                    <div className="mt-1 text-xs text-neutral-500">{meta}</div>
                  </Link>
                  <button
                    type="button"
                    className="-mr-1 shrink-0 rounded-full p-2 text-lg leading-none text-neutral-600 hover:bg-neutral-100"
                    aria-label="메뉴"
                    onClick={(e) => e.preventDefault()}
                  >
                    ⋮
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
