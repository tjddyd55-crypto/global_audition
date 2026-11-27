import { Image, Pressable, StyleSheet, View } from 'react-native'
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
      <View style={styles.glyph} pointerEvents="none">
        {tone === 'onImage' ? (
          <Image
            source={require('./heart-outline.png')}
            resizeMode="contain"
            style={[styles.halo, { tintColor: '#111827' }]}
          />
        ) : null}
        <Image
          source={isSaved ? require('./heart-filled.png') : require('./heart-outline.png')}
          resizeMode="contain"
          style={[styles.icon, { tintColor: isSaved ? HEART_RED : outline }]}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    overflow: 'visible',
  },
  glyph: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  icon: {
    width: 22,
    height: 22,
    aspectRatio: 1,
  },
  halo: {
    position: 'absolute',
    width: 24,
    height: 24,
    aspectRatio: 1,
  },
})
