'use client'

import Image from 'next/image'
import { Link } from '../../i18n.config'
import type { MockVideo } from '../../lib/mocks/videos'

interface VideoCardProps {
  video: MockVideo
  compact?: boolean
}

const safeStr = (v: unknown): string => (v != null && typeof v === 'string' ? v : '')

export default function VideoCard({ video, compact = false }: VideoCardProps) {
  if (!video) return null
  const title = safeStr(video.title)
  const description = safeStr(video.description)
  const channelName = safeStr(video.channelName)
  const channelAvatar = video?.channelAvatar ?? ''
  const thumbnail = video?.thumbnail ?? null
  const views = Number(video?.views ?? 0)
  const likes = Number(video?.likes ?? 0)
  const uploadedAt = safeStr(video?.uploadedAt)
  const category = safeStr(video?.category)

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="relative aspect-video bg-gray-100">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title || '영상'}
            fill
            className="object-cover"
            sizes={compact ? '(max-width: 1024px) 50vw, 25vw' : '(max-width: 1024px) 50vw, 33vw'}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            이미지 준비 중
          </div>
        )}
        {category && (
          <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-0.5 text-xs font-semibold text-white">
            {category}
          </span>
        )}
      </div>
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <Link href={`/channel/${video?.channelId ?? ''}`} className="mb-2 inline-flex items-center gap-2">
          {channelAvatar ? (
            <div className="relative h-7 w-7 overflow-hidden rounded-full border border-gray-200">
              <Image
                src={channelAvatar}
                alt={channelName || '채널'}
                fill
                className="object-cover"
                sizes="28px"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs text-gray-500">
              ?
            </div>
          )}
          <span className="text-sm text-gray-700">{channelName || '채널'}</span>
        </Link>

        <h3 className={`${compact ? 'text-sm' : 'text-base'} mb-1 line-clamp-2 font-semibold text-gray-900`}>
          {title || '제목 없음'}
        </h3>
        {description && (
          <p className={`${compact ? 'text-sm' : 'text-sm'} line-clamp-2 text-gray-600`}>{description}</p>
        )}

        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span>◉ {views.toLocaleString()}</span>
          <span>♡ {likes.toLocaleString()}</span>
        </div>
        {compact && uploadedAt && <p className="mt-1 text-xs text-gray-500">{uploadedAt.replaceAll('-', '. ')}</p>}
      </div>
    </article>
  )
}
