import { Image, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSavedAuditionIds, useToggleSavedAudition } from './useSavedAuditions'

const HEART_RED = '#E11D48'

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
      <Image
        source={isSaved ? require('./heart-filled.png') : require('./heart-outline.png')}
        resizeMode="contain"
        style={[
          styles.icon,
          { tintColor: isSaved ? HEART_RED : outline },
          tone === 'onImage' ? styles.onImage : null,
        ]}
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
  icon: {
    width: 22,
    height: 22,
    aspectRatio: 1,
  },
  onImage: {
    // Image has no textShadow; a 1px dark fringe is enough on posters.
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
  },
})
