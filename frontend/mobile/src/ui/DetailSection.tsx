import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, space } from '../theme/tokens'

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  )
}

export function DetailBulletList({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Text key={item} style={styles.item}>
          · {item}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  list: { gap: 6 },
  item: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
})
