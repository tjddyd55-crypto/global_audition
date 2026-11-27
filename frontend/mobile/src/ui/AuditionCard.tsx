import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { AuditionDto } from '../api/types'
import { recruitFieldLabels } from '../../../web/src/shared/audition/recruitFields'
import { auditionHeadlineTitle, auditionListImageUrl } from '../domain/auditionImages'
import { auditionStatusLabel } from '../domain/statusLabels'
import { formatDday, recommendationReasonLabel } from '../../../web/src/shared/recommend/reasonLabels'
import { colors, radius } from '../theme/tokens'
import { scriptLineHeight } from '../i18n/typography'
import { PosterImage } from './PosterImage'
import { SaveAuditionButton } from '../features/saves/SaveAuditionButton'
import { StatusPill, toneForApplicationStatus } from './StatusPill'

type Props = {
  audition: AuditionDto
  onPress: () => void
  variant?: 'list' | 'home'
  reasons?: string[]
  eligibility?: string | null
}

export function AuditionCard({ audition, onPress, variant = 'list', reasons = [], eligibility }: Props) {
  const { t, i18n } = useTranslation()
  const title = auditionHeadlineTitle(audition)
  const label = auditionStatusLabel(audition.status, audition.recruitmentRoundLabel)
  const fields = recruitFieldLabels(audition.recruitFields, (k) => t(`recruitField.${k}`)).join(' · ')
  const countryCode = audition.countryCode?.trim()
  const country = countryCode ? t(`country.${countryCode}`, { defaultValue: countryCode }) : ''
  const dday = formatDday(audition.remainingDays, t)
  const reasonLabels = reasons
    .map((reason) => recommendationReasonLabel(reason, eligibility, t))
    .filter((value): value is string => Boolean(value))
  const line = { lineHeight: scriptLineHeight(i18n.language, 13, 20) }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <PosterImage uri={auditionListImageUrl(audition.images)} />
        <View style={styles.body}>
          <StatusPill label={label} tone={toneForApplicationStatus(audition.status)} />
          <Text style={[styles.title, { lineHeight: scriptLineHeight(i18n.language, 16, 22) }]} numberOfLines={2}>
            {title}
          </Text>
          {audition.agencyName ? (
            <Text style={[styles.meta, line]} numberOfLines={1}>
              {audition.agencyName}
            </Text>
          ) : null}
          {variant === 'home' ? (
            <Text style={[styles.meta, line]} numberOfLines={2}>
              {[fields, country, dday].filter(Boolean).join(' · ')}
            </Text>
          ) : (
            <>
              {audition.description ? (
                <Text style={[styles.meta, line]} numberOfLines={2}>
                  {audition.description}
                </Text>
              ) : null}
              <Text style={styles.faint}>
                {t('common.applicantsCount', { n: audition.applicantsCount })} · {t('common.daysLeftCount', { n: audition.remainingDays })}
              </Text>
            </>
          )}
          {reasonLabels.length > 0 ? (
            <View style={styles.reasons}>
              {reasonLabels.map((reason) => (
                <Text key={reason} style={styles.reason}>
                  {reason}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.heart} pointerEvents="box-none">
        <SaveAuditionButton auditionId={audition.id} tone="onImage" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  heart: { position: 'absolute', top: 10, right: 10, zIndex: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  body: { padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  faint: { fontSize: 12, color: colors.faint },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reason: {
    fontSize: 11,
    color: colors.purple,
    backgroundColor: colors.heroStart,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
})
