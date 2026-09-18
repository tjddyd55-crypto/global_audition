import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { channelApi } from '../api/channel'
import { queryKeys } from '../api/queryKeys'
import { narrow } from '../theme/narrow'
import { ChannelCard } from '../ui/ChannelCard'
import { EmptyState, ErrorState } from '../ui/EmptyState'
import { colors, space } from '../theme/tokens'

type Props = {
  showTitle?: boolean
}

export function ChannelsListPanel({ showTitle = true }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const query = useQuery({ queryKey: queryKeys.channelsPublic, queryFn: channelApi.listPublic })

  return (
    <>
      {showTitle ? <Text style={styles.title}>{t('channel.listTitle')}</Text> : null}
      {query.isError ? <ErrorState message={t('channel.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((item) => (
        <ChannelCard key={item.userId} item={item} onPress={() => router.push(`/channel/${item.userId}`)} />
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? <EmptyState title={t('common.empty')} /> : null}
    </>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: space.md, ...narrow.shrink },
})
