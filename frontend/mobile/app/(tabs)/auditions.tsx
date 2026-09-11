import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { auditionApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { AuditionCard } from '../../src/ui/AuditionCard'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'

export default function AuditionsScreen() {
  const router = useRouter()
  const query = useQuery({ queryKey: queryKeys.auditionsOpen, queryFn: auditionApi.listOpen })

  return (
    <Screen loading={query.isLoading}>
      {query.isError ? <ErrorState message="오디션 목록을 불러오지 못했습니다." onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((audition) => (
        <View key={audition.id} style={{ marginBottom: 12 }}>
          <AuditionCard audition={audition} onPress={() => router.push(`/auditions/${audition.id}`)} />
        </View>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="모집중인 오디션이 없습니다" body="공고가 열리면 바로 확인할 수 있습니다." />
      ) : null}
    </Screen>
  )
}
