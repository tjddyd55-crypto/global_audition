import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Screen } from '../src/ui/Screen'
import { colors, radius } from '../src/theme/tokens'

const NOTICE_TYPES = ['ROUND_OPEN', 'PASS_NOTICE', 'FAIL_NOTICE', 'FINAL_NOTICE'] as const

export default function NotificationsScreen() {
  const { t } = useTranslation()
  return (
    <Screen>
      <Text style={styles.title}>{t('notifications.title')}</Text>
      <Text style={styles.body}>{t('notifications.apiMissing')}</Text>
      {NOTICE_TYPES.map((type) => (
        <View key={type} style={styles.card}>
          <Text style={styles.type}>{type}</Text>
          <Text style={styles.body}>{t(`notifications.${type}`)}</Text>
        </View>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, color: colors.text },
  body: { color: colors.muted, lineHeight: 22, marginBottom: 12 },
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
