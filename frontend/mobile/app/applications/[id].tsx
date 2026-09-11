import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { applicationApi, roundApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { ApiError } from '../../src/api/http'
import { applicationResultCopy, applicationStatusLabel, nationalityLabel, roundSubmissionLabel, snsPlatformLabel } from '../../src/domain/statusLabels'
import { VIDEO_URL_HINT, isValidAuditionVideoUrl } from '../../src/domain/videoUrl'
import { Button } from '../../src/ui/Button'
import { ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { StatusPill, toneForApplicationStatus } from '../../src/ui/StatusPill'
import { TextField } from '../../src/ui/TextField'
import { colors, radius } from '../../src/theme/tokens'

export default function ApplicationDetailScreen() {
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
      setMessage('라운드 자료가 제출되었습니다.')
      void query.refetch()
      void eligibilityQuery.refetch()
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : '라운드 제출에 실패했습니다.')
    },
  })

  return (
    <Screen loading={query.isLoading}>
      {query.isError ? <ErrorState message="지원서를 불러오지 못했습니다." onRetry={() => void query.refetch()} /> : null}
      {app ? (
        <View style={styles.stack}>
          <StatusPill label={applicationStatusLabel(app.status)} tone={toneForApplicationStatus(app.status)} />
          <Text style={styles.title}>{app.auditionTitle}</Text>
          <Text style={styles.copy}>{applicationResultCopy(app.status)}</Text>
          <Text style={styles.meta}>
            {app.name ?? '이름 미입력'} · {nationalityLabel(app.nationality)} {app.age != null ? `· ${app.age}세` : ''}
          </Text>
          {app.introText ? <Text style={styles.body}>{app.introText}</Text> : null}
          {app.videoUrl ? <Button label="제출 영상 열기" variant="secondary" onPress={() => void Linking.openURL(app.videoUrl ?? '')} /> : null}
          {app.snsLinks.map((link) => (
            <Text key={`${link.platform}-${link.url}`} style={styles.meta}>
              {snsPlatformLabel(link.platform)} · {link.url}
            </Text>
          ))}
          <Text style={styles.section}>
            진행 방식 {app.processMode}
            {app.processMode === 'MULTI_ROUND' ? ` · 현재 라운드 ${app.currentRoundNumber}` : ''}
          </Text>
          {app.roundSummaries.map((round) => (
            <Text key={round.roundId} style={styles.meta}>
              라운드 {round.roundNumber}
              {round.roundNumber === app.currentRoundNumber ? ' (현재)' : ''}
            </Text>
          ))}
          {eligibilityQuery.data ? (
            <View style={styles.card}>
              <Text style={styles.section}>다음 라운드</Text>
              <Text style={styles.meta}>제출 상태 {roundSubmissionLabel(eligibilityQuery.data.submissionStatus)}</Text>
              {eligibilityQuery.data.reason ? <Text style={styles.copy}>{eligibilityQuery.data.reason}</Text> : null}
              {eligibilityQuery.data.canSubmit ? (
                <>
                  <Text style={styles.copy}>다음 라운드 제출이 열려 있습니다. 서버가 요구하는 형식만 보내세요.</Text>
                  <TextField label="영상 URL" value={videoUrl} onChangeText={setVideoUrl} keyboardType="url" />
                  <TextField label="파일 URL (백엔드 fileUrl)" value={fileUrl} onChangeText={setFileUrl} keyboardType="url" />
                  <TextField label="텍스트 답변" value={textAnswer} onChangeText={setTextAnswer} multiline />
                  <Button
                    label="라운드 제출"
                    loading={submitRound.isPending}
                    onPress={() => {
                      if (videoUrl.trim() && !isValidAuditionVideoUrl(videoUrl) && !fileUrl.trim() && !textAnswer.trim()) {
                        setMessage(VIDEO_URL_HINT)
                        return
                      }
                      submitRound.mutate()
                    }}
                  />
                </>
              ) : (
                <Text style={styles.copy}>지금은 이 라운드에 제출할 수 없습니다.</Text>
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
