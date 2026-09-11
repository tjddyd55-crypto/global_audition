import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native'
import { applicationApi, creditApi, profileApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { RequireAuth } from '../../../src/auth/RequireAuth'
import { useAuth } from '../../../src/auth/AuthProvider'
import { ApiError } from '../../../src/api/http'
import { parseInsufficientCredits } from '../../../src/api/parsers'
import { calculateAge } from '../../../src/domain/age'
import { ALLOWED_NATIONALITIES, ALLOWED_SNS_PLATFORMS, nationalityLabel, snsPlatformLabel } from '../../../src/domain/statusLabels'
import { VIDEO_URL_HINT, isValidAuditionVideoUrl } from '../../../src/domain/videoUrl'
import { pickLibraryVideo } from '../../../src/features/media/pickMedia'
import { Button } from '../../../src/ui/Button'
import { ConfirmDialog } from '../../../src/ui/ConfirmDialog'
import { Screen } from '../../../src/ui/Screen'
import { StickyCta } from '../../../src/ui/StickyCta'
import { TextField } from '../../../src/ui/TextField'
import { colors, radius } from '../../../src/theme/tokens'

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const profileQuery = useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get, enabled: isAuthenticated })
  const runtimeQuery = useQuery({ queryKey: queryKeys.creditRuntime, queryFn: creditApi.runtime })
  const balanceQuery = useQuery({
    queryKey: queryKeys.creditBalance,
    queryFn: creditApi.balance,
    enabled: isAuthenticated,
  })

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [introText, setIntroText] = useState('')
  const [snsPlatform, setSnsPlatform] = useState('instagram')
  const [snsUrl, setSnsUrl] = useState('')
  const [localVideoName, setLocalVideoName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filled, setFilled] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!profileQuery.data || filled) return
    setName(profileQuery.data.name ?? profileQuery.data.nickname ?? '')
    setBirthDate(profileQuery.data.birthDate ?? '')
    setNationality(profileQuery.data.nationality ?? '')
    setIntroText(profileQuery.data.introText ?? '')
    const first = profileQuery.data.snsLinks?.find((item) => item.platform && item.url)
    if (first) {
      setSnsPlatform(first.platform)
      setSnsUrl(first.url)
    }
    setFilled(true)
  }, [profileQuery.data, filled])

  const age = useMemo(() => (birthDate ? calculateAge(birthDate) : null), [birthDate])
  const runtime = runtimeQuery.data
  const fee = runtime?.applicationFeeCredits ?? 0
  const creditMode = runtime?.applicationPaymentMode === 'CREDIT' && fee > 0
  const balance = balanceQuery.data?.balance ?? 0
  const insufficient = creditMode && balance < fee

  const submit = async () => {
    setError(null)
    if (!isValidAuditionVideoUrl(videoUrl)) {
      setError(VIDEO_URL_HINT)
      return
    }
    setLoading(true)
    try {
      await applicationApi.submit({
        auditionId: id,
        name: name.trim() || null,
        birthDate: birthDate.trim() || null,
        age: birthDate.trim() ? age : null,
        nationality: nationality || null,
        videoUrl: videoUrl.trim(),
        introText: introText.trim() || null,
        snsLinks: snsUrl.trim() ? [{ platform: snsPlatform, url: snsUrl.trim() }] : [],
      })
      router.replace('/(tabs)/applications')
    } catch (err) {
      if (err instanceof ApiError) {
        const short = parseInsufficientCredits(err.body)
        if (short) {
          setError(
            `크레딧이 부족합니다. 필요 ${short.requiredCredits} · 보유 ${short.currentCredits} · 부족 ${short.shortfallCredits}`,
          )
        } else {
          setError(err.message)
        }
      } else {
        setError('지원에 실패했습니다.')
      }
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  return (
    <RequireAuth message="지원하려면 로그인이 필요합니다.">
    <Screen
      footer={
        <StickyCta>
          <Button
            label="지원서 제출"
            loading={loading}
            onPress={() => {
              setError(null)
              if (!isValidAuditionVideoUrl(videoUrl)) {
                setError(VIDEO_URL_HINT)
                return
              }
              if (insufficient) {
                setError(`크레딧이 부족합니다. 필요 ${fee} · 보유 ${balance} · 부족 ${fee - balance}`)
                return
              }
              if (creditMode) {
                setConfirmOpen(true)
                return
              }
              void submit()
            }}
          />
        </StickyCta>
      }
    >
      <ConfirmDialog
        visible={confirmOpen}
        message={`지원 시 크레딧 ${fee} 이 차감됩니다. 현재 보유 ${balance}. 계속할까요?`}
        confirmLabel="지원하기"
        loading={loading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void submit()}
      />
      <KeyboardAvoidingView behavior="padding" style={styles.form}>
        <Text style={styles.lead}>백엔드는 영상 파일 업로드가 아니라 YouTube/TikTok/Instagram URL을 받습니다.</Text>
        {runtime && !creditMode ? <Text style={styles.meta}>이번 지원은 무료입니다.</Text> : null}
        {creditMode && !insufficient ? (
          <Text style={styles.meta}>지원 시 크레딧 {fee} 차감 · 보유 {balance}</Text>
        ) : null}
        {insufficient ? (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              크레딧이 부족합니다. 필요 {fee} · 보유 {balance} · 부족 {fee - balance}
            </Text>
            <Button label="충전하기" onPress={() => router.push('/credits')} />
          </View>
        ) : null}
        <TextField label="이름" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextField label="생년월일 (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} placeholder="1999-01-31" />
        {age != null ? <Text style={styles.meta}>만 나이 {age}세 (서버가 최종 확인)</Text> : null}
        <Text style={styles.label}>국적</Text>
        <View style={styles.chips}>
          {ALLOWED_NATIONALITIES.map((code) => (
            <Chip key={code} label={nationalityLabel(code)} selected={nationality === code} onPress={() => setNationality(code)} />
          ))}
        </View>
        <TextField label="영상 URL" value={videoUrl} onChangeText={setVideoUrl} keyboardType="url" placeholder="https://youtu.be/..." />
        <Button
          label="갤러리에서 영상 선택 (참고)"
          variant="secondary"
          onPress={async () => {
            const picked = await pickLibraryVideo()
            if (!picked) return
            setLocalVideoName(picked.fileName ?? '선택한 로컬 영상')
            setError('로컬 파일은 아직 지원 API가 없습니다. YouTube/TikTok/Instagram에 올린 뒤 URL을 입력해 주세요.')
          }}
        />
        {localVideoName ? <Text style={styles.meta}>선택됨: {localVideoName}</Text> : null}
        <TextField label="자기소개" value={introText} onChangeText={setIntroText} multiline />
        <Text style={styles.label}>SNS (선택)</Text>
        <View style={styles.chips}>
          {ALLOWED_SNS_PLATFORMS.map((platform) => (
            <Chip key={platform} label={snsPlatformLabel(platform)} selected={snsPlatform === platform} onPress={() => setSnsPlatform(platform)} />
          ))}
        </View>
        <TextField label="SNS URL" value={snsUrl} onChangeText={setSnsUrl} keyboardType="url" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </Screen>
    </RequireAuth>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Text onPress={onPress} style={[styles.chip, selected && styles.chipOn]} accessibilityRole="button">
      {label}
    </Text>
  )
}

const styles = StyleSheet.create({
  form: { gap: 12, paddingBottom: 16 },
  lead: { color: colors.muted, lineHeight: 20, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 13 },
  label: { fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
    color: colors.muted,
  },
  chipOn: { borderColor: colors.purple, backgroundColor: colors.heroStart, color: colors.purple, fontWeight: '700' },
  error: { color: colors.dangerText, lineHeight: 20 },
  warn: { gap: 8, padding: 12, borderRadius: radius.card, backgroundColor: colors.warnBg },
  warnText: { color: colors.warnText, lineHeight: 20 },
})
