import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { publicPlatformApi } from '../../src/api/endpoints'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { useTranslation } from 'react-i18next'

type Detail = {
  displayName?: string
  countryCode?: string
  website?: string | null
  auditions?: { id?: string; title?: string; status?: string }[]
}

export default function AgencyDetailScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const query = useQuery({
    queryKey: ['public-agency', id],
    queryFn: () => publicPlatformApi.agency(String(id)),
    enabled: Boolean(id),
  })
  const agency = (query.data ?? null) as Detail | null
  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{agency?.displayName}</Text>
      <Text>{agency?.countryCode}</Text>
      {agency?.website ? <Text>{agency.website}</Text> : null}
      {(agency?.auditions ?? []).map((audition) => (
        <View key={audition.id} style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '700' }}>{audition.title}</Text>
          <Text>{audition.status}</Text>
          {audition.id ? <Button label={t('agencies.apply')} onPress={() => router.push(`/auditions/${audition.id}/apply`)} /> : null}
        </View>
      ))}
    </Screen>
  )
}
