import { Pressable, StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSavedAuditionIds, useToggleSavedAudition } from './useSavedAuditions'

export function SaveAuditionButton({ auditionId, tone = 'onSurface' }: {
  auditionId: string
  tone?: 'onImage' | 'onSurface'
}) {
  const { t } = useTranslation()
  const { saved } = useSavedAuditionIds()
  const { toggle, isPending } = useToggleSavedAudition()
  const isSaved = saved.has(auditionId)
  const onImage = tone === 'onImage'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSaved }}
      accessibilityLabel={t(isSaved ? 'savedAuditions.unsaveAria' : 'savedAuditions.saveAria')}
      hitSlop={8}
      disabled={isPending}
      onPress={() => toggle(auditionId, isSaved)}
      style={styles.button}
    >
      <Text style={[
        styles.star,
        onImage && styles.imageStar,
        isSaved && styles.selected,
      ]}>{isSaved ? '★' : '☆'}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { padding: 7, alignItems: 'center', justifyContent: 'center' },
  star: { fontSize: 25, lineHeight: 26, color: '#111827', includeFontPadding: false },
  imageStar: { color: '#FFFFFF', textShadowColor: '#111827', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  selected: { color: '#F5B700' },
})
