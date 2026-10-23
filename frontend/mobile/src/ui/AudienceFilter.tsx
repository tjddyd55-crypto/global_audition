import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AUDIENCE_FILTER_OPTIONS } from '../domain/audience'
import { useAudienceCountry } from '../domain/AudienceCountryProvider'
import { colors, radius } from '../theme/tokens'

export function AudienceFilter() {
  const { t } = useTranslation()
  const { country, selectCountry } = useAudienceCountry()

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {AUDIENCE_FILTER_OPTIONS.map((option) => {
          const selected = country === option
          const label = option === 'ALL' ? t('auditions.filterAll') : t(`country.${option}`)
          return (
            <Text
              key={option}
              accessibilityRole="button"
              onPress={() => selectCountry(option)}
              style={[styles.chip, selected && styles.chipOn]}
            >
              {label}
            </Text>
          )
        })}
      </View>
      <Text style={styles.hint}>{t('auditions.filterHint')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    overflow: 'hidden',
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  chipOn: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
    color: '#ffffff',
  },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
})
