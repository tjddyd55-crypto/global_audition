import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { auditionApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { useAuth } from '../../../src/auth/AuthProvider'
import { auditionDetailImageUrl, auditionHeadlineTitle } from '../../../src/domain/auditionImages'
import { auditionStatusLabel } from '../../../src/domain/statusLabels'
import { Button } from '../../../src/ui/Button'
import { ErrorState } from '../../../src/ui/EmptyState'
import { PosterImage } from '../../../src/ui/PosterImage'
import { Screen } from '../../../src/ui/Screen'
import { StatusPill, toneForApplicationStatus } from '../../../src/ui/StatusPill'
import { StickyCta } from '../../../src/ui/StickyCta'
import { colors } from '../../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

export default function AuditionDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const query = useQuery({ queryKey: queryKeys.audition(id), queryFn: () => auditionApi.getById(id), enabled: Boolean(id) })
  const audition = query.data

  const applyBlocked = audition?.canApply === false
  const alreadyApplied = audition?.hasApplied === true
  const ctaLabel = alreadyApplied ? t('auditionDetail.viewApplication') : applyBlocked ? t('auditionDetail.cannotApply') : t('apply.title')

  return (
    <Screen
      loading={query.isLoading}
      padded={false}
      footer={
        audition ? (
          <StickyCta>
            <Button
              label={ctaLabel}
              disabled={applyBlocked && !alreadyApplied}
              onPress={() => {
                if (alreadyApplied && audition.myApplicationId) {
                  router.push(`/applications/${audition.myApplicationId}`)
                  return
                }
                if (!isAuthenticated) {
                  router.push('/(auth)/login')
                  return
                }
                router.push(`/auditions/${id}/apply`)
              }}
            />
          </StickyCta>
        ) : null
      }
    >
      {query.isError ? <ErrorState message={t('auditionDetail.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {audition ? (
        <View>
          <PosterImage uri={auditionDetailImageUrl(audition.images)} />
          <View style={styles.body}>
            <StatusPill
              label={auditionStatusLabel(audition.status, audition.recruitmentRoundLabel)}
              tone={toneForApplicationStatus(audition.status)}
            />
            <Text style={styles.title}>{auditionHeadlineTitle(audition)}</Text>
            <Text style={styles.meta}>{audition.agencyName}</Text>
            {audition.applyBlockedMessage ? <Text style={styles.warn}>{audition.applyBlockedMessage}</Text> : null}
            <Text style={styles.desc}>{audition.description}</Text>
            <Info label={t('auditionDetail.recruitFields')} items={audition.recruitFields} />
            <Info label={t('auditionDetail.qualifications')} items={audition.qualifications} />
            <Info label={t('auditionDetail.schedules')} items={audition.schedules} />
            <Info label={t('auditionDetail.benefits')} items={audition.benefits} />
            {audition.location ? <Text style={styles.meta}>장소 {audition.location}</Text> : null}
            {audition.processMode === 'MULTI_ROUND' ? (
              <Text style={styles.meta}>
                진행 {audition.currentRoundNumber ?? '-'} / {audition.maxRoundNumber ?? audition.roundSummaries?.length ?? '-'} 라운드
              </Text>
            ) : null}
            <View style={styles.row}>
              <Button label={t('auditionDetail.viewVote')} variant="secondary" onPress={() => router.push(`/auditions/${id}/vote`)} />
              <Button label={t('common.ranking')} variant="secondary" onPress={() => router.push(`/auditions/${id}/ranking`)} />
            </View>
            {audition.videoUrl ? (
              <Button label="소개 영상 열기" variant="secondary" onPress={() => void Linking.openURL(audition.videoUrl ?? '')} />
            ) : null}
          </View>
        </View>
      ) : null}
    </Screen>
  )
}

function Info({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.section}>{label}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.desc}>
          · {item}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { color: colors.muted, fontSize: 14 },
  desc: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  warn: { color: colors.warnText, backgroundColor: colors.warnBg, padding: 10, borderRadius: 8 },
  section: { fontWeight: '700', color: colors.text, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8 },
})
