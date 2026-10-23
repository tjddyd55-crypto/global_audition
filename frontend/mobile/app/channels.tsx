import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Text, TextInput, View } from 'react-native'
import { publicPlatformApi } from '../src/api/endpoints'
import { Button } from '../src/ui/Button'
import { Screen } from '../src/ui/Screen'
import { useTranslation } from 'react-i18next'

type ChannelRow = { userId?: string; nickname?: string; introText?: string | null }

export default function ChannelsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [stageName, setStageName] = useState('')
  const query = useQuery({
    queryKey: ['public-channels', stageName],
    queryFn: () => publicPlatformApi.channels(stageName ? { q: stageName } : undefined),
  })
  const rows = Array.isArray(query.data) ? (query.data as ChannelRow[]) : []
  return (
    <Screen refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{t('common.channels')}</Text>
      <TextInput
        value={stageName}
        onChangeText={setStageName}
        placeholder={t('channel.stageName')}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginVertical: 12 }}
      />
      {rows.map((row) => (
        <View key={row.userId} style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '700' }}>{row.nickname}</Text>
          <Text>{row.introText}</Text>
          {row.userId ? <Button label={t('channel.viewCta')} onPress={() => router.push(`/channel/${row.userId}`)} /> : null}
        </View>
      ))}
    </Screen>
  )
}
