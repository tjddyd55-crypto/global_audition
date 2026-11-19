import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '../src/ui/Button'
import { useTranslation } from 'react-i18next'
import { notificationApi } from '../src/api/endpoints'
import { queryKeys } from '../src/api/queryKeys'
import { notificationBadge, notificationCopy } from '../src/features/notifications/notificationCopy'
import { nativeRouteForNotification } from '../src/features/notifications/notificationRoute'
import { Screen } from '../src/ui/Screen'
import { colors, radius } from '../src/theme/tokens'

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.notifications, queryFn: notificationApi.list })
  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
  return (
    <Screen loading={query.isLoading} onRefresh={() => query.refetch()}>
      <Text style={styles.title}>{t('notifications.title')}</Text>
      <Text style={styles.body}>{t('studio.notificationsHint')}</Text>
      {query.isError ? <Text style={styles.body}>{t('notifications.loadFailed')}</Text> : null}
      {query.data && query.data.length === 0 ? <Text style={styles.body}>{t('notifications.empty')}</Text> : null}
      {(query.data ?? []).map((item) => {
        const copy = notificationCopy(item, (key, params) => t(`notifications.${key}`, params))
        const route = nativeRouteForNotification(item, i18n.language || 'ko')
        return (
        <View key={item.id} style={styles.card}>
          <Text style={styles.type}>{copy.title}</Text>
          {copy.body ? <Text style={styles.body}>{copy.body}</Text> : null}
          <Text style={styles.meta}>
            {notificationBadge(item, (key) => t(`notifications.${key}`))}
            {item.readAt ? ` · ${t('studio.read')}` : ''}
          </Text>
          {route ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                if (!item.readAt) markRead.mutate(item.id)
                router.push(route as never)
              }}
            >
              <Text style={styles.open}>{t('notifications.open')}</Text>
            </Pressable>
          ) : null}
          {!item.readAt ? (
            <Button label={t('studio.markRead')} variant="secondary" onPress={() => markRead.mutate(item.id)} />
          ) : null}
        </View>
        )
      })}
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
  open: { color: colors.purple, fontWeight: '700', textDecorationLine: 'underline', marginVertical: 8 },
})
