import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AUDIENCE_FILTER_OPTIONS, type AudienceFilterOption } from '../domain/audience'
import { useAudienceCountry } from '../domain/AudienceCountryProvider'
import { colors } from '../theme/tokens'
import { scriptLineHeight } from '../i18n/typography'
import { ScrollChipRow } from './ScrollChipRow'

/**
 * 홈과 오디션 목록이 같은 칩을 쓴다.
 * 높이는 고정하고, 가로 스크롤은 이 필터 줄 안에서만 일어난다.
 * 선택된 칩(예: KH/UZ)이 화면 밖이면 그 칩이 보이도록 스크롤한다(ScrollChipRow).
 * (화면 재마운트·앱 재실행 후 저장된 국가가 복원될 때도 동일)
 */
export function AudienceFilter() {
  const { t, i18n } = useTranslation()
  const { country, selectCountry } = useAudienceCountry()
  return (
    <View style={styles.wrap}>
      <ScrollChipRow
        options={AUDIENCE_FILTER_OPTIONS}
        selected={country}
        onSelect={(option) => selectCountry(option as AudienceFilterOption)}
        labelOf={(option) => (option === 'ALL' ? t('auditions.filterAll') : t(`country.${option}`))}
      />
      <Text style={[styles.hint, { lineHeight: scriptLineHeight(i18n.language, 13, 18) }]}>{t('auditions.filterHint')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12, alignSelf: 'stretch', maxWidth: '100%' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
})
