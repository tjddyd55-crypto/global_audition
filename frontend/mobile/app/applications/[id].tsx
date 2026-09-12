import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { applicationApi, roundApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { ApiError } from '../../src/api/http'
import { applicationResultCopy, applicationStatusLabel, nationalityLabel, roundSubmissionLabel, snsPlatformLabel } from '../../src/domain/statusLabels'
import { videoUrlHint, isValidAuditionVideoUrl } from '../../src/domain/videoUrl'
import { Button } from '../../src/ui/Button'
import { ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { StatusPill, toneForApplicationStatus } from '../../src/ui/StatusPill'
import { TextField } from '../../src/ui/TextField'
import { colors, radius } from '../../src/theme/tokens'

export default function ApplicationDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const query = useQuery({ queryKey: queryKeys.myApplication(id), queryFn: () => applicationApi.getMine(id), enabled: Boolean(id) })
  const app = query.data
  const currentRound = app?.roundSummaries.find((round) => round.roundNumber === app.currentRoundNumber)
  const eligibilityQuery = useQuery({
    queryKey: queryKeys.roundEligibility(id, currentRound?.roundId ?? ''),
    queryFn: () => roundApi.eligibility(id, currentRound!.roundId),
    enabled: Boolean(app?.processMode === 'MULTI_ROUND' && currentRound?.roundId),
  })

  const [videoUrl, setVideoUrl] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [textAnswer, setTextAnswer] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const submitRound = useMutation({
    mutationFn: () =>
      roundApi.submit(id, currentRound!.roundId, {
        videoUrl: videoUrl.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        textAnswer: textAnswer.trim() || undefined,
      }),
    onSuccess: () => {
      setMessage(t('application.roundSubmitted'))
      void query.refetch()
      void eligibilityQuery.refetch()
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : t('application.roundSubmitFailed'))
    },
  })

  return (
    <Screen loading={query.isLoading}>
      {query.isError ? <ErrorState message={t('application.detailLoadFailed')} onRetry={() => void query.refetch()} /> : null}
      {app ? (
        <View style={styles.stack}>
          <StatusPill label={applicationStatusLabel(app.status)} tone={toneForApplicationStatus(app.status)} />
          <Text style={styles.title}>{app.auditionTitle}</Text>
          <Text style={styles.copy}>{applicationResultCopy(app.status)}</Text>
          <Text style={styles.meta}>
            {app.name ?? t('application.nameUnset')} · {nationalityLabel(app.nationality)}{' '}
            {app.age != null ? `· ${t('application.ageYears', { age: app.age })}` : ''}
          </Text>
          {app.introText ? <Text style={styles.body}>{app.introText}</Text> : null}
          {app.videoUrl ? (
            <Button label={t('application.openSubmittedVideo')} variant="secondary" onPress={() => void Linking.openURL(app.videoUrl ?? '')} />
          ) : null}
          {app.snsLinks.map((link) => (
            <Text key={`${link.platform}-${link.url}`} style={styles.meta}>
              {snsPlatformLabel(link.platform)} · {link.url}
            </Text>
          ))}
          <Text style={styles.section}>
            {t('application.processMode', { mode: app.processMode })}
            {app.processMode === 'MULTI_ROUND'
              ? ` · ${t('application.currentRoundOf', {
                  current: app.currentRoundNumber ?? '-',
                  max: app.maxRoundNumber ?? app.roundSummaries.length,
                })}`
              : ''}
          </Text>
          {app.roundSummaries.map((round) => (
            <Text key={round.roundId} style={styles.meta}>
              {t('application.roundN', { n: round.roundNumber })}
              {round.roundNumber === app.currentRoundNumber ? ` ${t('application.currentMark')}` : ''}
            </Text>
          ))}
          {eligibilityQuery.data ? (
            <View style={styles.card}>
              <Text style={styles.section}>{t('application.nextRound')}</Text>
              <Text style={styles.meta}>
                {t('application.submissionStatus', { status: roundSubmissionLabel(eligibilityQuery.data.submissionStatus) })}
              </Text>
              {eligibilityQuery.data.reason ? <Text style={styles.copy}>{eligibilityQuery.data.reason}</Text> : null}
              {eligibilityQuery.data.canSubmit ? (
                <>
                  <Text style={styles.copy}>{t('application.nextRoundOpen')}</Text>
                  <TextField label={t('apply.videoUrl')} value={videoUrl} onChangeText={setVideoUrl} keyboardType="url" />
                  <TextField label={t('application.fileUrl')} value={fileUrl} onChangeText={setFileUrl} keyboardType="url" />
                  <TextField label={t('application.textAnswer')} value={textAnswer} onChangeText={setTextAnswer} multiline />
                  <Button
                    label={t('application.submitRound')}
                    loading={submitRound.isPending}
                    onPress={() => {
                      if (videoUrl.trim() && !isValidAuditionVideoUrl(videoUrl) && !fileUrl.trim() && !textAnswer.trim()) {
                        setMessage(videoUrlHint())
                        return
                      }
                      submitRound.mutate()
                    }}
                  />
                </>
              ) : (
                <Text style={styles.copy}>{t('application.cannotSubmitNow')}</Text>
              )}
            </View>
          ) : null}
          {message ? <Text style={styles.copy}>{message}</Text> : null}
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  copy: { color: colors.muted, lineHeight: 22, fontSize: 14 },
  meta: { color: colors.faint, fontSize: 13 },
  body: { color: colors.text, lineHeight: 22 },
  section: { fontWeight: '700', marginTop: 8, color: colors.text },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    gap: 10,
    backgroundColor: colors.surface,
  },
})
