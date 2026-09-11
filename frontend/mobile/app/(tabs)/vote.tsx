import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { auditionApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { AuditionCard } from '../../src/ui/AuditionCard'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'

export default function VoteHubScreen() {
  const router = useRouter()
  const query = useQuery({ queryKey: queryKeys.auditionsOpen, queryFn: auditionApi.listOpen })

  return (
    <Screen loading={query.isLoading}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 }}>공개 투표</Text>
      <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>
        오디션을 선택하면 해당 공고의 공개 투표 보드로 이동합니다. 투표 규칙은 서버가 결정합니다.
      </Text>
      {query.isError ? <ErrorState message="투표 가능한 오디션을 불러오지 못했습니다." onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((audition) => (
        <View key={audition.id} style={{ marginBottom: 12 }}>
          <AuditionCard audition={audition} onPress={() => router.push(`/auditions/${audition.id}/vote`)} />
        </View>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="투표 중인 오디션이 없습니다" />
      ) : null}
    </Screen>
  )
}
