'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@/i18n.config'
import EmptyState from '@/components/ui/EmptyState'
import { listBrowsePublicVideos } from '@/lib/api/channelVideoPublic'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { LAYOUT } from '@/lib/design-tokens'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'

const CATEGORIES = ['전체 카테고리', 'Vocal', 'Dance', 'Rap'] as const

const containerStyle: CSSProperties = {
  maxWidth: LAYOUT.containerMaxWidth,
  margin: '0 auto',
  padding: `0 ${LAYOUT.containerPaddingPx}px`,
}

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
        : (b.viewCount ?? 0) - (a.viewCount ?? 0)
    )
  }, [sortBy, videos])

  return (
    <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>영상 둘러보기</h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0 }}>실제 공개 영상이 최신 상태로 반영됩니다</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as (typeof CATEGORIES)[number])}
          style={{ height: 40, borderRadius: 8, border: '1px solid #ddd', padding: '0 12px', fontSize: 14 }}
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
          style={{ height: 40, borderRadius: 8, border: '1px solid #ddd', padding: '0 12px', fontSize: 14 }}
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-neutral-500">영상을 불러오는 중…</div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
          영상 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState message="아직 업로드된 공개 영상이 없습니다" />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((video) => {
            const thumbnail = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
            return (
              <Link
                key={video.videoId}
                href={`/videos/${video.videoId}`}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-500">썸네일 없음</div>
                  )}
                  {video.category ? (
                    <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
                      {video.category}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-neutral-100">
                      {video.channelProfileImageUrl ? (
                        <Image src={video.channelProfileImageUrl} alt="" fill className="object-cover" unoptimized />
                      ) : null}
                    </div>
                    <span className="truncate text-sm text-neutral-600">{video.channelDisplayName || '채널'}</span>
                  </div>
                  <h2 className="line-clamp-2 text-base font-semibold text-neutral-900">{video.title}</h2>
                  <p className="text-sm text-neutral-500">
                    조회 {Number(video.viewCount ?? 0).toLocaleString()} · 좋아요 {Number(video.likeCount ?? 0).toLocaleString()}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
