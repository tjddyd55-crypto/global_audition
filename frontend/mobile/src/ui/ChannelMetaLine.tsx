import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../theme/tokens'
import { toRecruitFieldCode } from '../../../web/src/shared/audition/recruitFields'

const KNOWN = new Set(['KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER'])

/** 국적 · 거주국 · 주 분야. 비공개 항목은 서버가 null 로 내려 생략된다. */
export function ChannelMetaLine({
  nationality,
  residence,
  mainField,
}: {
  nationality?: string | null
  residence?: string | null
  mainField?: string | null
}) {
  const { t } = useTranslation()
  const nat = nationality && KNOWN.has(nationality.toUpperCase()) ? nationality.toUpperCase() : null
  const res = residence && KNOWN.has(residence.toUpperCase()) ? residence.toUpperCase() : null
  const parts: string[] = []
  if (nat) parts.push(t(`nationality.${nat}`))
  if (res && res !== nat) parts.push(t('channel.residenceShort', { country: t(`nationality.${res}`) }))
  const code = mainField ? toRecruitFieldCode(mainField) : null
  const field = code ? t(`recruitField.${code}`) : mainField?.trim() || ''
  if (!parts.length && !field) return null
  return (
    <View style={styles.row}>
      {parts.length ? (
        <Text style={styles.meta} numberOfLines={1}>
          {parts.join(' · ')}
        </Text>
      ) : null}
      {field ? (
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {field}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  meta: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  pill: { backgroundColor: '#f3efff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.purple },
})
