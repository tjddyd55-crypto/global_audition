'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import ChannelCard from '../../../components/cards/ChannelCard'
import EmptyState from '../../../components/ui/EmptyState'
import { LAYOUT, CHANNEL_CARD } from '@/shared/design-tokens'
import { channelApi } from '@/shared/api/channel'

const containerStyle: React.CSSProperties = {
  maxWidth: LAYOUT.containerMaxWidth,
  margin: '0 auto',
  padding: `0 ${LAYOUT.containerPaddingPx}px`,
}

export default function ChannelsPage() {
  const tChannel = useTranslations('channel')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['channels-public'],
    queryFn: () => channelApi.listPublic(),
  })

  const channels = data ?? []

  return (
    <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>{tChannel('listTitle')}</h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0 }}>{tChannel('listHint')}</p>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-neutral-500">{tChannel('listLoading')}</p>
      ) : isError ? (
        <p className="text-center text-sm text-red-600">{tChannel('listLoadFailed')}</p>
      ) : channels.length === 0 ? (
        <EmptyState message={tChannel('listEmpty')} />
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
