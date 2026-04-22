'use client'

import Image from 'next/image'
import { useState } from 'react'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { isYoutubeShortsLikeUrl } from '@/shared/utils/videoEmbed'
import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'
import { VideoEmbedOverlay } from '@/components/video/VideoEmbedOverlay'

export type VideoSectionItem = {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl?: string | null
}

export type VideoSectionProps = {
  videos: VideoSectionItem[]
}

export function VideoSection({ videos }: VideoSectionProps) {
  const [play, setPlay] = useState<{ url: string; title?: string; thumbnail?: string } | null>(null)

  return (
    <>
      <section className={CARD_BASE}>
        <h2 className={`${TITLE_PAGE} mb-4`}>영상</h2>
        {videos.length === 0 ? (
          <p className={TEXT_SUB}>등록된 영상이 없습니다.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {videos.map((v) => {
              const thumb = resolveVideoThumbnailUrl(v.videoUrl, v.thumbnailUrl)
              const shorts = isYoutubeShortsLikeUrl(v.videoUrl)
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setPlay({
                        url: v.videoUrl,
                        title: v.title,
                        thumbnail: thumb ?? undefined,
                      })
                    }
                    className="group relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900 text-left shadow-sm ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                  >
                    <div
                      className={
                        shorts
                          ? 'relative mx-auto aspect-[9/16] max-h-[min(70vh,520px)] w-full max-w-[280px]'
                          : 'relative aspect-video w-full'
                      }
                    >
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          className="object-cover transition duration-200 group-hover:opacity-95"
                          sizes={shorts ? '(max-width: 640px) 100vw, 280px' : '(max-width: 640px) 100vw, 50vw'}
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
                          <span className="text-xs text-neutral-400">미리보기 없음</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition group-hover:bg-black/45">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg">
                          <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden>
                            <path d="M8 5v14l11-7L8 5z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-neutral-100 bg-white px-3 py-2">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {v.title?.trim() || 'Audition Video'}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <VideoEmbedOverlay play={play} onClose={() => setPlay(null)} />
    </>
  )
}
