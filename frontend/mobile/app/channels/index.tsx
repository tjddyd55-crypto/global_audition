import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { channelApi } from '../../src/api/channel'
import { queryKeys } from '../../src/api/queryKeys'
import { narrow } from '../../src/theme/narrow'
import { ChannelCard } from '../../src/ui/ChannelCard'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors, space } from '../../src/theme/tokens'

export default function ChannelsListScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const query = useQuery({ queryKey: queryKeys.channelsPublic, queryFn: channelApi.listPublic })

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('channel.listTitle')}</Text>
      {query.isError ? <ErrorState message={t('channel.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((item) => (
        <ChannelCard key={item.userId} item={item} onPress={() => router.push(`/channel/${item.userId}`)} />
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? <EmptyState title={t('common.empty')} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: space.md, ...narrow.shrink },
})
