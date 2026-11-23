import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '../src/ui/Button'
import { useTranslation } from 'react-i18next'
import { notificationApi, type NotificationSettings } from '../src/api/endpoints'
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
  const settingsQuery = useQuery({ queryKey: [...queryKeys.notifications, 'settings'], queryFn: notificationApi.settings })
  const saveSettings = useMutation({
    mutationFn: (body: NotificationSettings) => notificationApi.updateSettings(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
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

      <NotificationSettingsPanel
        value={settingsQuery.data}
        disabled={settingsQuery.isLoading || saveSettings.isPending}
        onChange={(next) => saveSettings.mutate(next)}
      />
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
            {[notificationBadge(item, (key) => t(`notifications.${key}`)), item.readAt ? t('studio.read') : '']
              .filter(Boolean)
              .join(' · ')}
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

function NotificationSettingsPanel({
  value,
  disabled,
  onChange,
}: {
  value?: NotificationSettings
  disabled: boolean
  onChange: (next: NotificationSettings) => void
}) {
  const { t } = useTranslation()
  const current: NotificationSettings = value ?? { savedDeadline: true, newMatch: true, results: true, offers: true }
  const rows: Array<{ key: keyof NotificationSettings; label: string }> = [
    { key: 'savedDeadline', label: t('notifications.savedDeadlineToggle') },
    { key: 'newMatch', label: t('notifications.newMatchToggle') },
    { key: 'results', label: t('notifications.resultsToggle') },
    { key: 'offers', label: t('notifications.offersToggle') },
  ]
  return (
    <View style={styles.settings} testID="notification-settings">
      <Text style={styles.settingsTitle}>{t('notifications.settingsTitle')}</Text>
      {rows.map((row) => (
        <View key={row.key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{row.label}</Text>
          <Switch
            value={current[row.key]}
            disabled={disabled}
            onValueChange={(checked) => onChange({ ...current, [row.key]: checked })}
            accessibilityLabel={row.label}
          />
        </View>
      ))}
    </View>
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
  settings: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
    gap: 10,
  },
  settingsTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingLabel: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
})
