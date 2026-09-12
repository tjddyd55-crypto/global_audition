import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { NOTIFICATION_TYPE_I18N } from '../src/features/notifications/notificationContract'
import { narrow } from '../src/theme/narrow'
import { Button } from '../src/ui/Button'
import { Screen } from '../src/ui/Screen'
import { colors, radius, space } from '../src/theme/tokens'

const NOTICE_TYPES = ['ROUND_OPEN', 'PASS_NOTICE', 'FAIL_NOTICE', 'FINAL_NOTICE'] as const

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Screen>
      <Text style={styles.title}>{t('notifications.title')}</Text>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{t('notifications.apiMissing')}</Text>
      </View>
      <Text style={styles.section}>{t('common.optional')}</Text>
      {NOTICE_TYPES.map((type) => (
        <View key={type} style={styles.card}>
          <Text style={styles.type}>{t(NOTIFICATION_TYPE_I18N[type])}</Text>
          <Text style={styles.body}>{t(NOTIFICATION_TYPE_I18N[type])}</Text>
        </View>
      ))}
      <Button label={t('myApplications.title')} variant="secondary" onPress={() => router.push('/(tabs)/applications')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: space.sm, color: colors.text, ...narrow.shrink },
  banner: {
    backgroundColor: colors.infoBg,
    borderColor: colors.infoText,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.md,
  },
  bannerText: { color: colors.infoText, lineHeight: 22, fontSize: 14, ...narrow.shrink },
  section: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: space.xs },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.xs,
    backgroundColor: colors.surface,
    gap: 4,
  },
  type: { fontWeight: '700', color: colors.purple },
  body: { color: colors.muted, lineHeight: 20, ...narrow.shrink },
})
