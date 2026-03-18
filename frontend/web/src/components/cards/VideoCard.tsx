'use client'

import Image from 'next/image'
import { Link } from '../../i18n.config'
import type { MockVideo } from '../../lib/mocks/videos'

interface VideoCardProps {
  video: MockVideo
  compact?: boolean
}

export default function VideoCard({ video, compact = false }: VideoCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="relative aspect-video bg-gray-100">
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
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
        <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-0.5 text-xs font-semibold text-white">
          {video.category}
        </span>
      </div>
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <Link href={`/channel/${video.channelId}`} className="mb-2 inline-flex items-center gap-2">
          <div className="relative h-7 w-7 overflow-hidden rounded-full border border-gray-200">
            <Image
              src={video.channelAvatar}
              alt={video.channelName}
              fill
              className="object-cover"
              sizes="28px"
              unoptimized
            />
          </div>
          <span className="text-sm text-gray-700">{video.channelName}</span>
        </Link>

        <h3 className={`${compact ? 'text-sm' : 'text-base'} mb-1 line-clamp-2 font-semibold text-gray-900`}>
          {video.title}
        </h3>
        <p className={`${compact ? 'text-sm' : 'text-sm'} line-clamp-2 text-gray-600`}>{video.description}</p>

        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span>◉ {video.views.toLocaleString()}</span>
          <span>♡ {video.likes.toLocaleString()}</span>
        </div>
        {compact && <p className="mt-1 text-xs text-gray-500">{video.uploadedAt.replaceAll('-', '. ')}</p>}
      </div>
    </article>
  )
}
