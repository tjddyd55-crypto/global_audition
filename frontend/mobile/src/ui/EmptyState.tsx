import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'
import { Button } from './Button'

export function EmptyState({ title, body, actionLabel, onAction }: { title: string; body?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>불러오지 못했습니다</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry ? <Button label="다시 시도" onPress={onRetry} variant="secondary" /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { gap: 12, paddingVertical: 32 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, lineHeight: 22, color: colors.muted },
})
