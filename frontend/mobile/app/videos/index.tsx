import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { channelVideoApi } from '../../src/api/channelVideo'
import { queryKeys } from '../../src/api/queryKeys'
import { narrow } from '../../src/theme/narrow'
import { Chip } from '../../src/ui/Chip'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { VideoListRow } from '../../src/ui/VideoListRow'
import { colors, space } from '../../src/theme/tokens'

const CATEGORIES = ['전체 카테고리', 'Vocal', 'Dance', 'Rap'] as const
type SortMode = 'latest' | 'popular'

export default function VideosBrowseScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('전체 카테고리')
  const [sortBy, setSortBy] = useState<SortMode>('latest')

  const query = useQuery({
    queryKey: queryKeys.videoBrowse(category),
    queryFn: () => channelVideoApi.listBrowse(category),
  })

  const sorted = useMemo(() => {
    const list = [...(query.data ?? [])]
    return list.sort((a, b) =>
      sortBy === 'latest'
        ? Date.parse(b.publishedAt || '0') - Date.parse(a.publishedAt || '0')
        : b.viewCount - a.viewCount,
    )
  }, [query.data, sortBy])

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('video.browseTitle')}</Text>
      <Text style={styles.hint}>{t('video.browseHint')}</Text>

      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c === '전체 카테고리' ? t('video.allCategories') : c} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>
      <View style={styles.chips}>
        <Chip label={t('video.sortLatest')} selected={sortBy === 'latest'} onPress={() => setSortBy('latest')} />
        <Chip label={t('video.sortPopular')} selected={sortBy === 'popular'} onPress={() => setSortBy('popular')} />
      </View>

      {query.isError ? <ErrorState message={t('common.loadFailedTitle')} onRetry={() => void query.refetch()} /> : null}
      {sorted.map((item) => (
        <VideoListRow key={item.videoId} item={item} onPress={() => router.push(`/videos/${item.videoId}`)} />
      ))}
      {!query.isLoading && sorted.length === 0 ? <EmptyState title={t('video.browseEmpty')} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: space.xs, ...narrow.shrink },
  hint: { fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: space.md, ...narrow.shrink },
  chips: { ...narrow.wrap, marginBottom: space.sm },
})
