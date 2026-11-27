import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { auditionApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { useAuth } from '../../../src/auth/AuthProvider'
import { auditionDetailImageUrl, auditionHeadlineTitle } from '../../../src/domain/auditionImages'
import { auditionStatusLabel } from '../../../src/domain/statusLabels'
import { canShowVoting, canViewRanking } from '../../../src/domain/ranking'
import { Button } from '../../../src/ui/Button'
import { ErrorState } from '../../../src/ui/EmptyState'
import { PosterImage } from '../../../src/ui/PosterImage'
import { SaveAuditionButton } from '../../../src/features/saves/SaveAuditionButton'
import { Screen } from '../../../src/ui/Screen'
import { StatusPill, toneForApplicationStatus } from '../../../src/ui/StatusPill'
import { StickyCta } from '../../../src/ui/StickyCta'
import { colors } from '../../../src/theme/tokens'
import { useTranslation } from 'react-i18next'
import { applyBlockedDisplayMessage } from '../../../src/domain/applyBlocked'
import { recruitFieldLabels } from '../../../../web/src/shared/audition/recruitFields'
import { displayAuditionTag } from '../../../../web/src/shared/audition/auditionTagLabels'
import { NativeVideoPlayer } from '../../../src/features/media/NativeVideoPlayer'
import { getRuntimeLocale } from '../../../src/i18n/runtime'

export default function AuditionDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const locale = getRuntimeLocale()
  const query = useQuery({
    queryKey: queryKeys.audition(id, locale),
    queryFn: () => auditionApi.getById(id),
    enabled: Boolean(id),
  })
  const audition = query.data

  const applyBlocked = audition?.canApply === false
  const alreadyApplied = audition?.hasApplied === true
  const ctaLabel = alreadyApplied ? t('auditionDetail.viewApplication') : applyBlocked ? t('auditionDetail.cannotApply') : t('apply.title')

  return (
    <Screen
      topInset={false}
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
          <View style={styles.posterWrap}>
            <PosterImage uri={auditionDetailImageUrl(audition.images)} />
            {id ? (
              <View style={styles.heart}>
                <SaveAuditionButton auditionId={String(Array.isArray(id) ? id[0] : id)} tone="onImage" />
              </View>
            ) : null}
          </View>
          <View style={styles.body}>
            <StatusPill
              label={auditionStatusLabel(audition.status, audition.recruitmentRoundLabel)}
              tone={toneForApplicationStatus(audition.status)}
            />
            <Text style={styles.title}>{auditionHeadlineTitle(audition)}</Text>
            <Text style={styles.meta}>{audition.agencyName}</Text>
            <View style={styles.quickInfo}>
              {audition.countryCode ? (
                <Text style={styles.meta}>{t(`countries.${audition.countryCode}`, { defaultValue: audition.countryCode })}</Text>
              ) : null}
              {audition.deadlineAt || audition.endDate ? (
                <Text style={styles.meta}>{t('auditionDetail.endDate')}: {audition.deadlineAt?.slice(0, 10) || audition.endDate.slice(0, 10)}</Text>
              ) : null}
              {audition.createdAt ? (
                <Text style={styles.meta}>{t('auditionDetail.registeredAt')}: {audition.createdAt.slice(0, 10)}</Text>
              ) : null}
            </View>
            {audition.canApply === false ? (
              <Text style={styles.warn}>
                {applyBlockedDisplayMessage(audition.applyBlockedCode, t('apply.prevRoundBlocked'), t('apply.failed'))}
              </Text>
            ) : null}
            <Text style={styles.section}>{t('auditionDetail.description')}</Text>
            <Text style={styles.desc}>{audition.description}</Text>
            {audition.contentLocaleFallback ? <Text style={styles.warn}>{t('auditionDetail.contentFallback')}</Text> : null}
            {audition.translationStale ? <Text style={styles.warn}>{t('auditionDetail.translationStale')}</Text> : null}
            {audition.translationStatus && audition.translationStatus !== 'COMPLETED' ? (
              <Text style={styles.meta}>{audition.translationStatus}</Text>
            ) : null}
            <Info
              label={t('auditionDetail.tags')}
              items={(audition.tags ?? []).map((tag) => displayAuditionTag(tag, (key) => t(`auditionTag.${key}`)))}
            />
            <Info label={t('auditionDetail.recruitFields')} items={recruitFieldLabels(audition.recruitFields, (k) => t(`recruitField.${k}`))} />
            <Info label={t('auditionDetail.qualifications')} items={audition.qualifications} />
            <Info label={t('auditionDetail.schedules')} items={audition.schedules} />
            <Info label={t('auditionDetail.benefits')} items={audition.benefits} />
            {audition.location ? (
              <Text style={styles.meta}>{t('auditionDetail.locationLabel', { location: audition.location })}</Text>
            ) : null}
            {audition.processMode === 'MULTI_ROUND' ? (
              <Text style={styles.meta}>
                {t('auditionDetail.roundProgress', {
                  current: audition.currentRoundNumber ?? '-',
                  max: audition.maxRoundNumber ?? audition.roundSummaries?.length ?? '-',
                })}
              </Text>
            ) : null}
            <View style={styles.row}>
              {/* 공고 투표 설정상 이 회차에 투표가 없으면 투표 보기·랭킹을 숨긴다. */}
              {canShowVoting(audition) ? (
                <Button label={t('auditionDetail.viewVote')} variant="secondary" onPress={() => router.push(`/auditions/${id}/vote`)} />
              ) : null}
              {/* 랭킹 API 는 소유 기획사·관리자 전용 — 지원자/비로그인에게는 진입 버튼을 숨긴다(누르면 403). */}
              {canViewRanking(audition) ? (
                <Button label={t('common.ranking')} variant="secondary" onPress={() => router.push(`/auditions/${id}/ranking`)} />
              ) : null}
            </View>
            {(audition.galleryImages ?? []).length > 0 ? (
              <View style={styles.gallery}>
                <Text style={styles.section}>{t('auditionDetail.imagesHeading')}</Text>
                {audition.galleryImages.map((uri, index) => (
                  <PosterImage key={uri + index} uri={uri} compact />
                ))}
              </View>
            ) : null}
            {audition.videoUrl ? (
              <View>
                <Text style={styles.section}>{t('auditionDetail.introVideo')}</Text>
                <NativeVideoPlayer videoUrl={audition.videoUrl} />
              </View>
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
  posterWrap: { position: 'relative' },
  heart: { position: 'absolute', top: 12, right: 12, zIndex: 2 },
  body: { padding: 16, gap: 10, paddingBottom: 24 },
  quickInfo: { backgroundColor: colors.heroStart, borderRadius: 10, padding: 12, gap: 6 },
  gallery: { gap: 10, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { color: colors.muted, fontSize: 14 },
  desc: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  warn: { color: colors.warnText, backgroundColor: colors.warnBg, padding: 10, borderRadius: 8 },
  section: { fontWeight: '700', color: colors.text, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8 },
})
