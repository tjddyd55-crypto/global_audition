import { Image, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius } from '../theme/tokens'
import { POSTER_ASPECT } from '../domain/auditionImages'

type Props = {
  uri?: string | null
  compact?: boolean
  thumbnail?: boolean
}

export function PosterImage({ uri, compact, thumbnail }: Props) {
  const { t } = useTranslation()
  const frameStyle = thumbnail ? styles.thumbnail : compact ? styles.compact : styles.frame

  return (
    <View style={frameStyle}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.placeholder}>
          {thumbnail ? null : <Text style={styles.placeholderText}>{t('auditionDetail.noCover')}</Text>}
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
  compact: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  thumbnail: {
    width: 88,
    height: 66,
    borderRadius: radius.chip,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    flexShrink: 0,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    backgroundColor: colors.heroStart,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.faint,
    textAlign: 'center',
  },
})
