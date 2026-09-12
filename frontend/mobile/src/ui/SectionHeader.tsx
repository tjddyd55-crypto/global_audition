import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, space } from '../theme/tokens'

type Props = {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => [styles.actionWrap, pressed && styles.pressed]}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
    gap: space.xs,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  actionWrap: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple,
  },
  pressed: { opacity: 0.75 },
})
