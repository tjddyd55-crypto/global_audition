'use client'

import { useQuery } from '@tanstack/react-query'
import ChannelCard from '../../../components/cards/ChannelCard'
import EmptyState from '../../../components/ui/EmptyState'
import { LAYOUT, CHANNEL_CARD } from '../../../lib/design-tokens'
import { channelApi } from '../../../lib/api/channel'

const containerStyle: React.CSSProperties = {
  maxWidth: LAYOUT.containerMaxWidth,
  margin: '0 auto',
  padding: `0 ${LAYOUT.containerPaddingPx}px`,
}

export default function ChannelsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['channels-public'],
    queryFn: () => channelApi.listPublic(),
  })

  const channels = data ?? []

  return (
    <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>채널 리스트</h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0 }}>다양한 아티스트들의 채널을 탐색하고 영상을 감상하세요</p>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-neutral-500">채널을 불러오는 중…</p>
      ) : isError ? (
        <p className="text-center text-sm text-red-600">채널 목록을 불러오지 못했습니다.</p>
      ) : channels.length === 0 ? (
        <EmptyState message="등록된 채널이 없습니다" />
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          style={{ gap: CHANNEL_CARD.gridGapPx }}
        >
          {channels.map((channel) => (
            <ChannelCard key={channel.userId} channel={channel} />
          ))}
        </div>
      )}
    </div>
  )
}
