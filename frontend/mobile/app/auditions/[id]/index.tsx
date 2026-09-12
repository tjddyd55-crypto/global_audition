import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { auditionApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { useAuth } from '../../../src/auth/AuthProvider'
import { WEB_URL } from '../../../src/config/env'
import { auditionBadgeMeta } from '../../../src/domain/auditionBadges'
import { auditionDetailImageUrl, auditionHeadlineTitle } from '../../../src/domain/auditionImages'
import { Button } from '../../../src/ui/Button'
import { AuditionBadgeRow } from '../../../src/ui/Badges'
import { DetailBulletList, DetailSection } from '../../../src/ui/DetailSection'
import { ErrorState } from '../../../src/ui/EmptyState'
import { PosterImage } from '../../../src/ui/PosterImage'
import { Screen } from '../../../src/ui/Screen'
import { StickyCta } from '../../../src/ui/StickyCta'
import { colors, space } from '../../../src/theme/tokens'
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

  const galleryExtra = (audition?.galleryImages ?? []).filter((url) => url && url.trim().length > 0)
  const badges = audition ? auditionBadgeMeta(audition) : null

  const shareAudition = async () => {
    if (!audition) return
    const url = `${WEB_URL.replace(/\/+$/, '')}/auditions/${audition.id}`
    try {
      await Share.share({
        message: `${auditionHeadlineTitle(audition)}\n${url}`,
        url,
      })
    } catch {
      // 사용자 취소 등은 무시
    }
  }

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
            <Text style={styles.title}>{auditionHeadlineTitle(audition)}</Text>
            {badges ? <AuditionBadgeRow {...badges} /> : null}
            {audition.agencyName ? <Text style={styles.agency}>{audition.agencyName}</Text> : null}

            <View style={styles.metaBlock}>
              {audition.location ? (
                <Text style={styles.meta}>{t('auditionDetail.locationLabel', { location: audition.location })}</Text>
              ) : null}
              {audition.endDate ? (
                <Text style={styles.meta}>{t('auditionDetail.endDate')}: {audition.endDate}</Text>
              ) : null}
              {audition.createdAt ? (
                <Text style={styles.meta}>{t('auditionDetail.registeredAt')}: {audition.createdAt}</Text>
              ) : null}
              <Text style={styles.meta}>
                {t('common.applicantsCount', { n: audition.applicantsCount })} · {t('common.daysLeftCount', { n: audition.remainingDays })}
              </Text>
              {audition.processMode === 'MULTI_ROUND' ? (
                <Text style={styles.meta}>
                  {t('auditionDetail.roundProgress', {
                    current: audition.currentRoundNumber ?? '-',
                    max: audition.maxRoundNumber ?? audition.roundSummaries?.length ?? '-',
                  })}
                </Text>
              ) : null}
            </View>

            {audition.applyBlockedMessage ? <Text style={styles.warn}>{audition.applyBlockedMessage}</Text> : null}

            {audition.description ? (
              <DetailSection title={t('auditionDetail.introTitle')}>
                <Text style={styles.desc}>{audition.description}</Text>
              </DetailSection>
            ) : null}

            {audition.qualifications.length > 0 ? (
              <DetailSection title={t('auditionDetail.qualificationsTitle')}>
                <DetailBulletList items={audition.qualifications} />
              </DetailSection>
            ) : null}

            {audition.recruitFields.length > 0 ? (
              <DetailSection title={t('auditionDetail.recruitFields')}>
                <DetailBulletList items={audition.recruitFields} />
              </DetailSection>
            ) : null}

            {audition.schedules.length > 0 ? (
              <DetailSection title={t('auditionDetail.schedules')}>
                <DetailBulletList items={audition.schedules} />
              </DetailSection>
            ) : null}

            {audition.benefits.length > 0 ? (
              <DetailSection title={t('auditionDetail.benefits')}>
                <DetailBulletList items={audition.benefits} />
              </DetailSection>
            ) : null}

            {galleryExtra.length > 0 ? (
              <DetailSection title={t('auditionDetail.galleryAria')}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                  {galleryExtra.map((url) => (
                    <View key={url} style={styles.galleryItem}>
                      <PosterImage uri={url} compact />
                    </View>
                  ))}
                </ScrollView>
              </DetailSection>
            ) : null}

            <View style={styles.actions}>
              <Button label={t('auditionDetail.viewVote')} variant="secondary" onPress={() => router.push(`/auditions/${id}/vote`)} />
              <Button label={t('common.ranking')} variant="secondary" onPress={() => router.push(`/auditions/${id}/ranking`)} />
              <Button label={t('auditionDetail.share')} variant="secondary" onPress={() => void shareAudition()} />
            </View>

            {audition.videoUrl ? (
              <Button label={t('auditionDetail.introVideo')} variant="secondary" onPress={() => void Linking.openURL(audition.videoUrl ?? '')} />
            ) : null}
          </View>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { padding: space.md, gap: space.sm, paddingBottom: space.xl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 32 },
  agency: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  metaBlock: { gap: 4 },
  meta: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  desc: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  warn: { color: colors.warnText, backgroundColor: colors.warnBg, padding: space.sm, borderRadius: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  galleryRow: { gap: space.xs },
  galleryItem: { width: 200 },
})
