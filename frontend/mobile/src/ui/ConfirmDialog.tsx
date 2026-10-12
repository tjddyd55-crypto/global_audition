import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../theme/tokens'
import { Button } from './Button'

type Props = {
  visible: boolean
  message: string
  confirmLabel?: string
  loading?: boolean
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ visible, message, confirmLabel = '확인', loading, danger, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityRole="button" accessibilityLabel="닫기">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label="취소" variant="secondary" onPress={onCancel} disabled={loading} />
            </View>
            <View style={styles.flex}>
              <Button label={confirmLabel} onPress={onConfirm} loading={loading} variant={danger ? 'danger' : 'primary'} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 20,
    gap: 16,
  },
  message: { fontSize: 15, lineHeight: 22, color: colors.text },
  actions: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
})
