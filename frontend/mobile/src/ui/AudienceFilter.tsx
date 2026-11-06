import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AUDIENCE_FILTER_OPTIONS } from '../domain/audience'
import { useAudienceCountry } from '../domain/AudienceCountryProvider'
import { colors, radius } from '../theme/tokens'
import {
  chipFrameFor,
  COUNTRY_CHIP_HEIGHT,
  COUNTRY_CHIP_ROW,
  COUNTRY_FILTER_AXIS,
} from './countryFilter/chipLayout'

/**
 * 홈과 오디션 목록이 같은 칩을 쓴다.
 * 높이는 고정하고, 가로 스크롤은 이 필터 줄 안에서만 일어난다.
 */
export function AudienceFilter() {
  const { t } = useTranslation()
  const { country, selectCountry } = useAudienceCountry()

  return (
    <View style={styles.wrap}>
      <View style={styles.clip}>
        <ScrollView
          horizontal={COUNTRY_FILTER_AXIS === 'horizontal'}
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.scroller}
          contentContainerStyle={styles.row}
        >
          {AUDIENCE_FILTER_OPTIONS.map((option) => {
            const selected = country === option
            const label = option === 'ALL' ? t('auditions.filterAll') : t(`country.${option}`)
            return (
              <CountryFilterChip
                key={option}
                option={option}
                label={label}
                selected={selected}
                onPress={() => selectCountry(option)}
              />
            )
          })}
        </ScrollView>
      </View>
      <Text style={styles.hint}>{t('auditions.filterHint')}</Text>
    </View>
  )
}

function CountryFilterChip({
  option,
  label,
  selected,
  onPress,
}: {
  option: string
  label: string
  selected: boolean
  onPress: () => void
}) {
  const frame = chipFrameFor(option)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.chip, { height: frame.height, paddingHorizontal: frame.paddingHorizontal }, selected && styles.chipOn]}
    >
      <Text numberOfLines={1} style={[styles.chipLabel, selected && styles.chipLabelOn]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12, alignSelf: 'stretch', maxWidth: '100%' },
  clip: { alignSelf: 'stretch', width: '100%', overflow: 'hidden' },
  scroller: { flexGrow: 0, height: COUNTRY_CHIP_HEIGHT },
  row: { ...COUNTRY_CHIP_ROW, gap: 8 },
  chip: {
    flexShrink: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  chipLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chipLabelOn: { color: '#ffffff' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
})
