import { StyleSheet, Text, View } from 'react-native'
import { NOTIFICATION_API_MISSING, NOTIFICATION_TYPE_COPY } from '../src/features/notifications/notificationContract'
import { Screen } from '../src/ui/Screen'
import { colors, radius } from '../src/theme/tokens'

export default function NotificationsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>알림</Text>
      <Text style={styles.body}>{NOTIFICATION_API_MISSING}</Text>
      {Object.entries(NOTIFICATION_TYPE_COPY).map(([type, copy]) => (
        <View key={type} style={styles.card}>
          <Text style={styles.type}>{type}</Text>
          <Text style={styles.body}>{copy}</Text>
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
