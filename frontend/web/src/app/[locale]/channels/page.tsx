'use client'

import ChannelCard from '../../../components/cards/ChannelCard'
import { mockChannels } from '../../../lib/mocks/channels'

export default function ChannelsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-10">
      <div className="mb-7">
        <h1 className="mb-2 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          채널 리스트
        </h1>
        <p className="text-lg text-gray-600">다양한 아티스트들의 채널을 탐색하고 영상을 감상하세요</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mockChannels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
    </div>
  )
}
