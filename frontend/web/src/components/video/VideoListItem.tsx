'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n.config'
import { DEFAULT_IMAGES } from '@/lib/constants/fallbacks'

export type VideoListItemProps = {
  href: string
  title: string
  thumbnailSrc: string | null
  channelName: string
  channelImageSrc: string | null
  viewCount: number
  /** 표시용 날짜·상대시간 등 (부모에서 포맷) */
  dateLabel: string
  categoryBadge?: string | null
  /** 썸네일·텍스트 아래 (관리 버튼 등) */
  footer?: ReactNode
}

export function VideoListItem({
  href,
  title,
  thumbnailSrc,
  channelName,
  channelImageSrc,
  viewCount,
  dateLabel,
  categoryBadge,
  footer,
}: VideoListItemProps) {
  const viewsFormatted = Number(viewCount ?? 0).toLocaleString('ko-KR')
  const meta = `${channelName || '채널'} · 조회수 ${viewsFormatted} · ${dateLabel}`

  return (
    <article className="w-full">
      <Link href={href} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {thumbnailSrc ? (
            <Image src={thumbnailSrc} alt={title} fill className="object-cover" sizes="100vw" unoptimized />
          ) : (
            <div className="flex h-full min-h-[8rem] items-center justify-center text-sm text-neutral-500">썸네일 없음</div>
          )}
          {categoryBadge ? (
            <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
              {categoryBadge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex gap-3 px-4 py-3">
        <Link
          href={href}
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200"
          aria-label={`${channelName || '채널'} 프로필`}
        >
          <Image
            src={channelImageSrc || DEFAULT_IMAGES.avatar}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </Link>

        <Link href={href} className="min-w-0 flex-1 text-inherit no-underline" aria-label={title}>
          <div className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900">{title}</div>
          <div className="mt-1 text-xs text-gray-500">{meta}</div>
        </Link>

        <button
          type="button"
          className="shrink-0 rounded-full p-2 text-lg leading-none text-gray-400 hover:bg-neutral-100"
          aria-label="메뉴"
          onClick={(e) => e.preventDefault()}
        >
          ⋮
        </button>
      </div>

      {footer ? <div className="px-4 pb-3">{footer}</div> : null}
    </article>
  )
}
