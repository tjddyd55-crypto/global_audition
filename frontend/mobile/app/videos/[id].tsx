import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { publicPlatformApi } from '../../src/api/endpoints'
import { NativeVideoPlayer } from '../../src/features/media/NativeVideoPlayer'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'

type Video = { title?: string; description?: string; videoUrl?: string; channelOwnerId?: string; channelDisplayName?: string }

export default function VideoScreen() {
  const { t } = useTranslation()
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
      {video?.videoUrl ? <NativeVideoPlayer videoUrl={video.videoUrl} /> : null}
      <Text style={styles.title}>{video?.title}</Text>
      {video?.description ? <Text style={styles.body}>{video.description}</Text> : null}
      {!video?.videoUrl && !query.isLoading ? <Text style={styles.body}>{t('video.cannotEmbed')}</Text> : null}
      {video?.channelOwnerId ? (
        <Button label={video.channelDisplayName || t('common.channels')} onPress={() => router.push(`/channel/${video.channelOwnerId}`)} />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  body: { color: colors.muted, lineHeight: 22, marginBottom: 12 },
})
