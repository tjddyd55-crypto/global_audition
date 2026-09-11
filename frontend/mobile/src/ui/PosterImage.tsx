import { Image, StyleSheet, View } from 'react-native'
import { colors, radius } from '../theme/tokens'
import { POSTER_ASPECT } from '../domain/auditionImages'

export function PosterImage({ uri, compact }: { uri?: string | null; compact?: boolean }) {
  return (
    <View style={[styles.frame, compact && styles.compact]}>
      {uri ? <Image source={{ uri }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors /> : <View style={styles.placeholder} />}
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: POSTER_ASPECT,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  compact: { aspectRatio: 16 / 9 },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, backgroundColor: colors.heroStart },
})
