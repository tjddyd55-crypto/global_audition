import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Share, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { channelVideoApi } from '../../src/api/channelVideo'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { formatRelativeTime } from '../../src/i18n/format'
import { narrow } from '../../src/theme/narrow'
import { Button } from '../../src/ui/Button'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { VideoEmbed } from '../../src/ui/VideoEmbed'
import { VideoListRow } from '../../src/ui/VideoListRow'
import { colors, space } from '../../src/theme/tokens'

export default function VideoDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [commentDraft, setCommentDraft] = useState('')
  const [expanded, setExpanded] = useState(false)

  const detailQuery = useQuery({
    queryKey: queryKeys.videoPublic(id),
    queryFn: () => channelVideoApi.getPublic(id),
    enabled: Boolean(id),
  })

  const commentsQuery = useQuery({
    queryKey: queryKeys.videoComments(id),
    queryFn: () => channelVideoApi.listComments(id),
    enabled: Boolean(id),
  })

  const recommendQuery = useQuery({
    queryKey: ['videos', id, 'recommend', detailQuery.data?.category ?? ''],
    queryFn: () => channelVideoApi.listRecommendations(detailQuery.data?.category ?? '', id),
    enabled: Boolean(id && detailQuery.data?.category),
  })

  useEffect(() => {
    if (!id) return
    void channelVideoApi.bumpView(id).then(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.videoPublic(id) })
    })
  }, [id, queryClient])

  const likeMutation = useMutation({
    mutationFn: () => channelVideoApi.like(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.videoPublic(id) }),
  })

  const dislikeMutation = useMutation({
    mutationFn: () => channelVideoApi.dislike(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.videoPublic(id) }),
  })

  const subscribeMutation = useMutation({
    mutationFn: (subscribed: boolean) =>
      subscribed ? channelVideoApi.unsubscribe(detailQuery.data!.channelOwnerId) : channelVideoApi.subscribe(detailQuery.data!.channelOwnerId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.videoPublic(id) }),
  })

  const commentMutation = useMutation({
    mutationFn: () => channelVideoApi.postComment(id, commentDraft.trim()),
    onSuccess: () => {
      setCommentDraft('')
      void queryClient.invalidateQueries({ queryKey: queryKeys.videoComments(id) })
    },
  })

  const detail = detailQuery.data

  if (detailQuery.isError) {
    return (
      <Screen>
        <ErrorState message={t('video.notFound')} onRetry={() => void detailQuery.refetch()} />
      </Screen>
    )
  }

  if (!detail && detailQuery.isLoading) {
    return <Screen loading />
  }

  if (!detail) {
    return (
      <Screen>
        <EmptyState title={t('video.notFound')} />
      </Screen>
    )
  }

  const description = detail.description?.trim() ?? ''
  const preview = description.length > 140 && !expanded ? `${description.slice(0, 140).trimEnd()}…` : description

  return (
    <Screen refreshing={detailQuery.isFetching} onRefresh={() => void detailQuery.refetch()}>
      <VideoEmbed videoUrl={detail.videoUrl} />
      <Text style={styles.title}>{detail.title}</Text>
      <Text style={styles.meta}>
        {detail.channelDisplayName} · {t('video.viewsCount', { n: detail.viewCount })}
        {detail.publishedAt ? ` · ${formatRelativeTime(detail.publishedAt)}` : ''}
      </Text>

      <View style={styles.actions}>
        <Button
          label={`♥ ${detail.likeCount}`}
          variant={detail.liked ? 'primary' : 'secondary'}
          disabled={!isAuthenticated || likeMutation.isPending}
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/login')
              return
            }
            likeMutation.mutate()
          }}
        />
        <Button
          label={t('video.dislike')}
          variant={detail.disliked ? 'primary' : 'secondary'}
          disabled={!isAuthenticated || dislikeMutation.isPending}
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/login')
              return
            }
            dislikeMutation.mutate()
          }}
        />
        <Button
          label={detail.subscribed ? t('video.subscribed') : t('channel.subscribe')}
          variant="secondary"
          disabled={!isAuthenticated || subscribeMutation.isPending}
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/login')
              return
            }
            subscribeMutation.mutate(detail.subscribed)
          }}
        />
        <Button
          label={t('channel.share')}
          variant="secondary"
          onPress={() => void Share.share({ message: detail.videoUrl })}
        />
      </View>

      <Button label={t('video.profileAria', { name: detail.channelDisplayName })} variant="secondary" onPress={() => router.push(`/channel/${detail.channelOwnerId}`)} />

      {description ? (
        <View style={styles.descBox}>
          <Text style={styles.desc}>{preview}</Text>
          {description.length > 140 ? (
            <Button label={expanded ? t('video.collapse') : t('video.more')} variant="secondary" onPress={() => setExpanded((v) => !v)} />
          ) : null}
        </View>
      ) : null}

      <Text style={styles.section}>{t('video.commentsCount', { n: commentsQuery.data?.length ?? 0 })}</Text>
      {isAuthenticated ? (
        <View style={styles.commentForm}>
          <TextField label={t('video.commentPlaceholder')} value={commentDraft} onChangeText={setCommentDraft} multiline />
          <Button label={t('video.commentSubmit')} loading={commentMutation.isPending} disabled={!commentDraft.trim()} onPress={() => commentMutation.mutate()} />
        </View>
      ) : null}
      {(commentsQuery.data ?? []).map((comment) => (
        <View key={comment.id} style={styles.comment}>
          <Text style={styles.commentAuthor}>{comment.authorDisplayName}</Text>
          <Text style={styles.commentBody}>{comment.content}</Text>
          {comment.createdAt ? <Text style={styles.meta}>{formatRelativeTime(comment.createdAt)}</Text> : null}
        </View>
      ))}

      {(recommendQuery.data ?? []).length > 0 ? (
        <>
          <Text style={styles.section}>{t('video.recommended')}</Text>
          {(recommendQuery.data ?? []).map((item) => (
            <VideoListRow
              key={item.videoId}
              item={{
                videoId: item.videoId,
                title: item.title,
                videoUrl: '',
                thumbnailUrl: item.thumbnailUrl,
                category: detail.category,
                channelDisplayName: item.channelDisplayName,
                channelProfileImageUrl: null,
                viewCount: item.viewCount,
                likeCount: 0,
                publishedAt: item.publishedAt,
              }}
              onPress={() => router.push(`/videos/${item.videoId}`)}
            />
          ))}
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: space.xs, ...narrow.shrink },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: space.sm, ...narrow.shrink },
  actions: { ...narrow.wrap, marginBottom: space.sm },
  descBox: { marginBottom: space.md, gap: space.xs },
  desc: { color: colors.textSecondary, lineHeight: 22, ...narrow.shrink },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginVertical: space.sm },
  commentForm: { gap: space.xs, marginBottom: space.sm },
  comment: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: space.sm, gap: 4 },
  commentAuthor: { fontWeight: '700', color: colors.text },
  commentBody: { color: colors.textSecondary, lineHeight: 20 },
})
