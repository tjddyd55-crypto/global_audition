import { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../theme/tokens'
import { POSTER_ASPECT } from '../domain/auditionImages'

/** Never show a silent blank frame for missing or broken Development poster URLs. */
export function PosterImage({ uri, compact }: { uri?: string | null; compact?: boolean }) {
  const [failed, setFailed] = useState(false)
  const source = uri?.trim() || ''
  useEffect(() => setFailed(false), [source])
  const showImage = source.length > 0 && !failed

  return (
    <View style={[styles.frame, compact && styles.compact]}>
      {showImage ? (
        <Image
          source={{ uri: source }}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.placeholder} accessibilityLabel="Audition image unavailable">
          <Text style={styles.placeholderTitle}>GLOBAL AUDITION</Text>
          <Text style={styles.placeholderHint}>IMAGE UNAVAILABLE</Text>
        </View>
      )}
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
  placeholder: {
    flex: 1,
    backgroundColor: colors.heroStart,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderTitle: { color: colors.purple, fontWeight: '800', fontSize: 16, letterSpacing: 0.6 },
  placeholderHint: { color: colors.muted, fontSize: 11, letterSpacing: 0.4 },
})
