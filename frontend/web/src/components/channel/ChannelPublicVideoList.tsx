'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n.config'
import type { MyChannelVideoRow } from '@/lib/api/videos'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'

const BTN_RELOAD =
  'rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50'

function formatCount(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n)
}

function formatPublishedAt(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(d)
}

export type ChannelPublicVideoListProps = {
  videosLoading: boolean
  videosError: boolean
  displayVideos: MyChannelVideoRow[]
}

/**
 * 공개 채널 영상 그리드 (클라이언트 전용). 상위 페이지에서 fetch/useQuery로 채운 목록을 표시하고 디버그·강제 새로고침을 제공한다.
 */
export function ChannelPublicVideoList({
  videosLoading,
  videosError,
  displayVideos,
}: ChannelPublicVideoListProps) {
  useEffect(() => {
    console.log('videos', displayVideos)
  }, [displayVideos])

  if (videosLoading && displayVideos.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">영상 목록을 불러오는 중…</p>
  }

  if (videosError && displayVideos.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-8 text-center">
        <p className="text-sm text-red-600">영상 목록 API를 불러오지 못했습니다.</p>
        <p className="text-xs text-neutral-500">잠시 후 새로고침 하거나, 네트워크를 확인해 주세요.</p>
      </div>
    )
  }

  if (displayVideos.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-neutral-50/80 px-6 py-10 text-center">
        <p className="text-base font-semibold text-neutral-900">아직 공개된 영상이 없습니다</p>
        <p className="mt-2 text-sm text-neutral-600">크리에이터가 영상을 공개하면 여기에 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" className={BTN_RELOAD} onClick={() => globalThis.location?.reload()}>
          reload
        </button>
      </div>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {displayVideos.map((v) => {
          const thumb = resolveVideoThumbnailUrl(v.videoUrl ?? '', v.thumbnailUrl)
          const cat = v.category?.trim()
          return (
            <li key={v.videoId}>
              <Link
                href={`/videos/${v.videoId}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="relative aspect-video w-full bg-neutral-200">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-500">썸네일 없음</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 group-hover:text-violet-800">
                    {v.title}
                  </h2>
                  {cat ? (
                    <span className="w-fit rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800">
                      {cat}
                    </span>
                  ) : null}
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                    <span>조회 {formatCount(Number(v.viewCount ?? 0))}</span>
                    <span className="text-neutral-300">·</span>
                    <span>좋아요 {formatCount(Number(v.likeCount ?? 0))}</span>
                    <span className="text-neutral-300">·</span>
                    <span>{formatPublishedAt(v.createdAt)}</span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
