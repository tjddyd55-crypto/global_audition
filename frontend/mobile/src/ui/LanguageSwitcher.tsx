import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { persistLocale } from '../i18n/LocaleProvider'
import { PRIMARY_LOCALES } from '../i18n/runtime'
import { colors, radius, space, touch } from '../theme/tokens'

const LOCALE_BADGE: Record<string, string> = {
  ko: 'KO',
  en: 'EN',
  mn: 'MN',
}

const A11Y_LABEL: Record<string, string> = {
  ko: '언어 변경',
  en: 'Change language',
  mn: 'Хэл солих',
}

type Props = {
  /** Extra margin for stack header placement. */
  style?: object
}

export function LanguageSwitcher({ style }: Props) {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const current = PRIMARY_LOCALES.includes(i18n.language) ? i18n.language : 'en'
  const badge = LOCALE_BADGE[current] ?? 'EN'

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={A11Y_LABEL[current] ?? A11Y_LABEL.en}
        style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      >
        <Ionicons name="globe-outline" size={16} color={colors.purple} />
        <Text style={styles.code}>{badge}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.md) }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('common.language')}</Text>
            {PRIMARY_LOCALES.map((code) => {
              const selected = current === code
              return (
                <Pressable
                  key={code}
                  onPress={() => {
                    void persistLocale(code).then(() => setOpen(false))
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                >
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{t(`locale.${code}`)}</Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={colors.purple} /> : null}
                </Pressable>
              )
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: touch.min,
    minHeight: touch.min,
    height: 38,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.purple,
    letterSpacing: 0.4,
  },
  pressed: { opacity: 0.88 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: space.md,
    paddingHorizontal: space.md,
    gap: space.xs,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touch.min,
    paddingHorizontal: space.sm,
    borderRadius: radius.button,
  },
  optionSelected: {
    backgroundColor: colors.heroStart,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.purple,
    fontWeight: '700',
  },
})
