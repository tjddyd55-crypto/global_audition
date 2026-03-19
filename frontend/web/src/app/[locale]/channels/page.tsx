'use client'

import ChannelCard from '../../../components/cards/ChannelCard'
import { mockChannels } from '../../../lib/mocks/channels'
import EmptyState from '../../../components/ui/EmptyState'
import { LAYOUT, CHANNEL_CARD } from '../../../lib/design-tokens'

const containerStyle: React.CSSProperties = {
  maxWidth: LAYOUT.containerMaxWidth,
  margin: '0 auto',
  padding: `0 ${LAYOUT.containerPaddingPx}px`,
}

export default function ChannelsPage() {
  const channels = mockChannels ?? []

  return (
    <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>채널 리스트</h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0 }}>다양한 아티스트들의 채널을 탐색하고 영상을 감상하세요</p>
      </div>

      {channels.length === 0 ? (
        <EmptyState message="등록된 채널이 없습니다" />
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          style={{ gap: CHANNEL_CARD.gridGapPx }}
        >
          {channels.map((channel, i) => (
            <ChannelCard key={channel?.id ?? `channel-${i}`} channel={channel} />
          ))}
        </div>
      )}
    </div>
  )
}
