import { StyleSheet, View } from 'react-native'
import { colors, radius, space } from '../theme/tokens'

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={styles.thumb} />
      <View style={styles.lines}>
        <View style={[styles.line, { width: '40%' }]} />
        <View style={[styles.line, { width: '90%' }]} />
        <View style={[styles.line, { width: '70%' }]} />
      </View>
    </View>
  )
}

export function AuditionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 88,
    height: 66,
    borderRadius: radius.chip,
    backgroundColor: colors.heroStart,
  },
  lines: { flex: 1, gap: 8, justifyContent: 'center' },
  line: {
    height: 10,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
})
