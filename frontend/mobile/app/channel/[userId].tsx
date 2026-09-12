import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { channelApi } from '../../src/api/channel'
import { channelVideoApi } from '../../src/api/channelVideo'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { nationalityLabel } from '../../src/domain/statusLabels'
import { narrow } from '../../src/theme/narrow'
import { Button } from '../../src/ui/Button'
import { Chip } from '../../src/ui/Chip'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { VideoEmbed } from '../../src/ui/VideoEmbed'
import { VideoListRow } from '../../src/ui/VideoListRow'
import { colors, space } from '../../src/theme/tokens'

type Tab = 'videos' | 'info'

export default function ChannelDetailScreen() {
  const { t } = useTranslation()
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [tab, setTab] = useState<Tab>('videos')

  const query = useQuery({
    queryKey: queryKeys.channelPublic(userId),
    queryFn: () => channelApi.getPublic(userId),
    enabled: Boolean(userId),
  })

  const subscribeMutation = useMutation({
    mutationFn: (subscribed: boolean) =>
      subscribed ? channelVideoApi.unsubscribe(userId) : channelVideoApi.subscribe(userId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.channelPublic(userId) }),
  })

  const channel = query.data

  if (query.isError) {
    return (
      <Screen>
        <ErrorState message={t('channel.loadFailed')} onRetry={() => void query.refetch()} />
      </Screen>
    )
  }

  if (!channel && query.isLoading) return <Screen loading />
  if (!channel) return <Screen><EmptyState title={t('channel.privateNotice')} /></Screen>

  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <View style={styles.head}>
        {channel.profileImageUrl ? (
          <Image source={{ uri: channel.profileImageUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initial}>{channel.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={narrow.shrink}>
          <Text style={styles.name} numberOfLines={2}>{channel.displayName}</Text>
          <Text style={styles.meta}>{t('channel.subscribersVideos', { subs: channel.subscriberCount, videos: channel.videoCount })}</Text>
          {channel.nationality ? <Text style={styles.meta}>{nationalityLabel(channel.nationality)}</Text> : null}
        </View>
      </View>

      <View style={styles.chips}>
        <Chip label={t('channel.tabVideos')} selected={tab === 'videos'} onPress={() => setTab('videos')} />
        <Chip label={t('channel.tabInfo')} selected={tab === 'info'} onPress={() => setTab('info')} />
      </View>

      <Button
        label={channel.subscribed ? t('channel.unsubscribe') : t('channel.subscribe')}
        variant={channel.subscribed ? 'secondary' : 'primary'}
        disabled={!isAuthenticated || subscribeMutation.isPending}
        onPress={() => {
          if (!isAuthenticated) {
            router.push('/(auth)/login')
            return
          }
          subscribeMutation.mutate(channel.subscribed)
        }}
      />

      {tab === 'videos' ? (
        <>
          {channel.featuredVideo?.videoUrl ? <VideoEmbed videoUrl={channel.featuredVideo.videoUrl} /> : null}
          {channel.videos.map((video) => (
            <VideoListRow
              key={video.videoId}
              item={{
                videoId: video.videoId,
                title: video.title,
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl,
                category: video.category ?? '',
                channelDisplayName: channel.displayName,
                channelProfileImageUrl: channel.profileImageUrl,
                viewCount: video.viewCount,
                likeCount: video.likeCount,
                publishedAt: video.createdAt,
              }}
              onPress={() => router.push(`/videos/${video.videoId}`)}
            />
          ))}
          {channel.videos.length === 0 ? <EmptyState title={t('video.browseEmpty')} /> : null}
        </>
      ) : (
        <View style={styles.infoBox}>
          {channel.introText ? <Text style={styles.infoText}>{channel.introText}</Text> : <Text style={styles.meta}>{t('common.noData')}</Text>}
          {channel.categories.length > 0 ? (
            <View style={styles.chips}>
              {channel.categories.map((c) => <Chip key={c} label={c} selected={false} onPress={() => undefined} />)}
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { ...narrow.row, alignItems: 'center', marginBottom: space.md, gap: space.md },
  avatar: { width: 72, height: 72, borderRadius: 36, flexShrink: 0 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.heroStart,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initial: { fontSize: 28, fontWeight: '800', color: colors.purple },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  chips: { ...narrow.wrap, marginVertical: space.sm },
  infoBox: { gap: space.sm, marginTop: space.sm },
  infoText: { color: colors.textSecondary, lineHeight: 22, ...narrow.shrink },
})
