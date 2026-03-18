'use client'

import Image from 'next/image'
import { Link } from '../../i18n.config'
import type { MockChannel } from '../../lib/mocks/channels'

interface ChannelCardProps {
  channel: MockChannel
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <article className="h-full rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex flex-col items-center">
        <div className="relative mb-3 h-24 w-24 overflow-hidden rounded-full border-4 border-[#f3ebff]">
          <Image src={channel.avatar} alt={channel.name} fill className="object-cover" sizes="96px" unoptimized />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{channel.name}</h3>
      </div>

      <p className="mb-4 min-h-[44px] text-center text-sm text-gray-600 line-clamp-2">{channel.description}</p>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">구독자</span>
          <strong className="text-purple-600">{channel.subscribers.toLocaleString()}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">▷ 영상</span>
          <strong>{channel.videoCount.toLocaleString()}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">◉ 조회수</span>
          <strong>{channel.totalViews.toLocaleString()}</strong>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3 text-center">
        <Link href={`/channel/${channel.id}`} className="text-sm font-semibold text-purple-600 hover:text-pink-600">
          채널 보기 →
        </Link>
      </div>
    </article>
  )
}
