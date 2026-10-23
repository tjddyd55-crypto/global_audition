import { useQuery } from '@tanstack/react-query'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { notificationApi } from '../src/api/endpoints'
import { queryKeys } from '../src/api/queryKeys'
import { Screen } from '../src/ui/Screen'
import { colors, radius } from '../src/theme/tokens'

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: queryKeys.notifications, queryFn: notificationApi.list })
  return (
    <Screen loading={query.isLoading} onRefresh={() => query.refetch()}>
      <Text style={styles.title}>{t('notifications.title')}</Text>
      <Text style={styles.body}>{t('studio.notificationsHint')}</Text>
      {query.isError ? <Text style={styles.body}>{t('notifications.loadFailed')}</Text> : null}
      {query.data && query.data.length === 0 ? <Text style={styles.body}>{t('notifications.empty')}</Text> : null}
      {(query.data ?? []).map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.type}>{item.title || item.type}</Text>
          {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          <Text style={styles.meta}>
            {item.type} · {item.status}
          </Text>
        </View>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, color: colors.text },
  body: { color: colors.muted, lineHeight: 22, marginBottom: 12 },
  meta: { color: colors.muted, fontSize: 12 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  type: { fontWeight: '700', color: colors.purple, marginBottom: 4 },
})
