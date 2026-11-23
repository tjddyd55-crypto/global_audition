import { Pressable, StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSavedAuditionIds, useToggleSavedAudition } from './useSavedAuditions'

export function SaveAuditionButton({ auditionId }: { auditionId: string }) {
  const { t } = useTranslation()
  const { saved } = useSavedAuditionIds()
  const { toggle, isPending } = useToggleSavedAudition()
  const isSaved = saved.has(auditionId)
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
      <Text style={[styles.icon, isSaved && styles.filled]}>{isSaved ? '♥' : '♡'}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  icon: { fontSize: 18, color: '#fff', lineHeight: 22 },
  filled: { color: '#f472b6' },
})
