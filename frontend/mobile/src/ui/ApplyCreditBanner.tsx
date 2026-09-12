import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius, space } from '../theme/tokens'

type Props = {
  fee: number
  balance: number
  active: boolean
  loading?: boolean
  error?: boolean
}

/** 지원 비용 표시만. 결제·차감 로직은 서버 제출 시 처리한다. */
export function ApplyCreditBanner({ fee, balance, active, loading, error }: Props) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <View style={[styles.box, styles.info]}>
        <Text style={styles.infoText}>{t('vote.loading')}</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.box, styles.error]}>
        <Text style={styles.errorText}>{t('apply.policyLoadFailed')}</Text>
      </View>
    )
  }

  if (!active) {
    return (
      <View style={[styles.box, styles.warn]}>
        <Text style={styles.warnText}>{t('apply.blocked')}</Text>
      </View>
    )
  }

  if (fee <= 0) {
    return (
      <View style={[styles.box, styles.free]}>
        <Text style={styles.freeText}>{t('apply.freeApply')}</Text>
      </View>
    )
  }

  const shortfall = fee - balance
  return (
    <View style={[styles.box, shortfall > 0 ? styles.warn : styles.info]}>
      <Text style={shortfall > 0 ? styles.warnText : styles.infoText}>
        {t('apply.creditMeta', { fee, balance })}
      </Text>
      {shortfall > 0 ? (
        <Text style={styles.warnSub}>{t('apply.insufficientDetail', { required: fee, current: balance, shortfall })}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
    marginBottom: space.sm,
    gap: 6,
  },
  info: {
    borderColor: colors.purple,
    backgroundColor: colors.heroStart,
  },
  infoText: { color: colors.purple, fontSize: 14, lineHeight: 20 },
  free: {
    borderColor: '#bbf7d0',
    backgroundColor: colors.successBg,
  },
  freeText: { color: colors.successText, fontSize: 14, lineHeight: 20 },
  warn: {
    borderColor: '#fde68a',
    backgroundColor: colors.warnBg,
  },
  warnText: { color: colors.warnText, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  warnSub: { color: colors.warnText, fontSize: 13, lineHeight: 18 },
  error: {
    borderColor: '#fecaca',
    backgroundColor: colors.dangerBg,
  },
  errorText: { color: colors.dangerText, fontSize: 14, lineHeight: 20 },
})
