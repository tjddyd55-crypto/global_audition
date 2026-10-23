import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { publicPlatformApi } from '../src/api/endpoints'
import { Button } from '../src/ui/Button'
import { Screen } from '../src/ui/Screen'
import { useTranslation } from 'react-i18next'

type VideoRow = { videoId?: string; title?: string; channelOwnerId?: string; channelDisplayName?: string; publishedAt?: string }

export default function VideosScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const query = useQuery({ queryKey: ['public-videos'], queryFn: () => publicPlatformApi.videos() })
  const rows = Array.isArray(query.data) ? (query.data as VideoRow[]) : []
  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{t('common.videos')}</Text>
      {rows.map((row) => {
        const fresh = row.publishedAt ? Date.now() - new Date(row.publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000 : false
        return (
          <View key={row.videoId} style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '700' }}>
              {row.title} {fresh ? t('video.newUpload') : ''}
            </Text>
            <Text>{row.channelDisplayName}</Text>
            {row.videoId ? <Button label={t('video.playAria')} onPress={() => router.push(`/videos/${row.videoId}`)} /> : null}
            {row.channelOwnerId ? (
              <Button label={row.channelDisplayName || t('common.channels')} onPress={() => router.push(`/channel/${row.channelOwnerId}`)} />
            ) : null}
          </View>
        )
      })}
    </Screen>
  )
}
