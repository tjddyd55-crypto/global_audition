import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { Text } from 'react-native'
import { apiRequest } from '../../src/api/http'
import { unwrapData } from '../../src/api/unwrap'
import { Screen } from '../../src/ui/Screen'

type Channel = {
  displayName?: string
  nickname?: string
  introText?: string | null
  careerText?: string | null
  bio?: string | null
  videos?: { videoId?: string; title?: string }[]
}

export default function ChannelScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const query = useQuery({
    queryKey: ['public-channel', userId],
    queryFn: async () => unwrapData(await apiRequest<unknown>(`/channels/${userId}`, { auth: false })) as Channel,
    enabled: Boolean(userId),
  })
  const channel = query.data
  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{channel?.displayName || channel?.nickname}</Text>
      {channel?.introText ? <Text>{channel.introText}</Text> : null}
      {channel?.careerText ? <Text>{channel.careerText}</Text> : null}
      {(channel?.videos ?? []).map((video) => (
        <Text key={video.videoId}>{video.title}</Text>
      ))}
    </Screen>
  )
}
