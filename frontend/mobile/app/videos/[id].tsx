import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from 'react-native'
import { publicPlatformApi } from '../../src/api/endpoints'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'

type Video = { title?: string; description?: string; videoUrl?: string; channelOwnerId?: string; channelDisplayName?: string }

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const query = useQuery({
    queryKey: ['public-video', id],
    queryFn: () => publicPlatformApi.video(String(id)) as Promise<Video>,
    enabled: Boolean(id),
  })
  const video = query.data
  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{video?.title}</Text>
      {video?.description ? <Text>{video.description}</Text> : null}
      {video?.videoUrl ? <Text>{video.videoUrl}</Text> : null}
      {video?.channelOwnerId ? (
        <Button label={video.channelDisplayName || 'Channel'} onPress={() => router.push(`/channel/${video.channelOwnerId}`)} />
      ) : null}
    </Screen>
  )
}
