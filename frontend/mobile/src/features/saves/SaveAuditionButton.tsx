import { Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useSavedAuditionIds, useToggleSavedAudition } from './useSavedAuditions'

const HEART_RED = '#E11D48'
const SIZE = 22

type Tone = 'onImage' | 'onSurface'

export function SaveAuditionButton({
  auditionId,
  tone = 'onSurface',
}: {
  auditionId: string
  tone?: Tone
}) {
  const { t } = useTranslation()
  const { saved } = useSavedAuditionIds()
  const { toggle, isPending } = useToggleSavedAudition()
  const isSaved = saved.has(auditionId)
  const outline = tone === 'onImage' ? '#FFFFFF' : '#111827'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSaved }}
      accessibilityLabel={isSaved ? t('savedAuditions.unsaveAria') : t('savedAuditions.saveAria')}
      hitSlop={8}
      disabled={isPending}
      onPress={() => toggle(auditionId, isSaved)}
      style={styles.btn}
    >
      <Ionicons
        name={isSaved ? 'heart' : 'heart-outline'}
        size={SIZE}
        color={isSaved ? HEART_RED : outline}
        style={tone === 'onImage' ? styles.onImage : undefined}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  onImage: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
