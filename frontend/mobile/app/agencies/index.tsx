import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { publicPlatformApi } from '../../src/api/endpoints'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { useTranslation } from 'react-i18next'

type AgencyRow = { id?: string; displayName?: string; countryCode?: string; openAuditionCount?: number }

export default function AgenciesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const query = useQuery({ queryKey: ['public-agencies'], queryFn: () => publicPlatformApi.agencies() })
  const rows = Array.isArray(query.data) ? (query.data as AgencyRow[]) : []
  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{t('agencies.title')}</Text>
      <Text>{t('agencies.hint')}</Text>
      {rows.map((row) => (
        <View key={row.id} style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '700' }}>{row.displayName}</Text>
          <Text>{row.countryCode}</Text>
          {row.id ? <Button label={t('agencies.openAuditions')} onPress={() => router.push(`/agencies/${row.id}`)} /> : null}
        </View>
      ))}
    </Screen>
  )
}
