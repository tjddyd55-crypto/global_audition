import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { applicationApi, profileApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { RequireAuth } from '../../../src/auth/RequireAuth'
import { useAuth } from '../../../src/auth/AuthProvider'
import { ApiError } from '../../../src/api/http'
import { calculateAge } from '../../../src/domain/age'
import { ALLOWED_NATIONALITIES, ALLOWED_SNS_PLATFORMS, nationalityLabel, snsPlatformLabel } from '../../../src/domain/statusLabels'
import { isValidAuditionVideoUrl, videoUrlHint } from '../../../src/domain/videoUrl'
import { pickLibraryVideo } from '../../../src/features/media/pickMedia'
import { useApplyCreditDisplay } from '../../../src/hooks/useApplyCreditDisplay'
import { narrow } from '../../../src/theme/narrow'
import { ApplyCreditBanner } from '../../../src/ui/ApplyCreditBanner'
import { Button } from '../../../src/ui/Button'
import { Chip } from '../../../src/ui/Chip'
import { DetailSection } from '../../../src/ui/DetailSection'
import { Screen } from '../../../src/ui/Screen'
import { StickyCta } from '../../../src/ui/StickyCta'
import { TextField } from '../../../src/ui/TextField'
import { colors, space } from '../../../src/theme/tokens'

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/

export default function ApplyScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const profileQuery = useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get, enabled: isAuthenticated })
  const credit = useApplyCreditDisplay(isAuthenticated)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [introText, setIntroText] = useState('')
  const [snsPlatform, setSnsPlatform] = useState('instagram')
  const [snsUrl, setSnsUrl] = useState('')
  const [localVideoName, setLocalVideoName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filled, setFilled] = useState(false)

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
  const birthInvalid = birthDate.trim() !== '' && !BIRTH_RE.test(birthDate.trim())
  const videoInvalid = videoUrl.trim() !== '' && !isValidAuditionVideoUrl(videoUrl)
  const submitDisabled =
    credit.loading ||
    credit.error ||
    !credit.active ||
    !credit.hasEnough ||
    !videoUrl.trim() ||
    birthInvalid ||
    (videoUrl.trim() !== '' && !isValidAuditionVideoUrl(videoUrl))

  return (
    <RequireAuth message={t('apply.loginRequired')}>
      <Screen
        loading={profileQuery.isLoading}
        footer={
          <StickyCta>
            <Button
              label={t('apply.submit')}
              loading={loading}
              disabled={submitDisabled}
              onPress={async () => {
                setError(null)
                setSuccess(null)
                if (birthInvalid) {
                  setError(t('profile.birthFormat'))
                  return
                }
                if (!isValidAuditionVideoUrl(videoUrl)) {
                  setError(videoUrlHint())
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
                  setSuccess(t('apply.success'))
                  router.replace('/(tabs)/applications')
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : t('apply.failed'))
                } finally {
                  setLoading(false)
                }
              }}
            />
          </StickyCta>
        }
      >
        <KeyboardAvoidingView behavior="padding" style={styles.form}>
          <Text style={styles.pageTitle}>{t('apply.title')}</Text>
          <ApplyCreditBanner
            fee={credit.fee}
            balance={credit.balance}
            active={credit.active}
            loading={credit.loading}
            error={credit.error}
          />

          <DetailSection title={t('apply.sectionBasic')}>
            <Text style={styles.hint}>{t('apply.urlOnlyHint')}</Text>
            <TextField label={t('apply.nameOptional')} value={name} onChangeText={setName} autoCapitalize="words" placeholder={t('apply.namePlaceholder')} />
            <TextField
              label={t('apply.birthDate')}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder={t('apply.birthDateHint')}
            />
            {birthInvalid ? <Text style={styles.error}>{t('profile.birthFormat')}</Text> : null}
            {age != null ? <Text style={styles.meta}>{t('apply.ageYears', { age })}</Text> : null}
            <Text style={styles.label}>{t('apply.nationality')}</Text>
            <View style={styles.chips}>
              {ALLOWED_NATIONALITIES.map((code) => (
                <Chip key={code} label={nationalityLabel(code)} selected={nationality === code} onPress={() => setNationality(code)} />
              ))}
            </View>
          </DetailSection>

          <DetailSection title={t('apply.sectionVideo')}>
            <TextField
              label={t('apply.videoUrl')}
              value={videoUrl}
              onChangeText={setVideoUrl}
              keyboardType="url"
              placeholder={t('apply.videoHint')}
            />
            {videoInvalid ? <Text style={styles.error}>{videoUrlHint()}</Text> : null}
            <Button
              label={t('apply.pickLocal')}
              variant="secondary"
              onPress={async () => {
                const picked = await pickLibraryVideo()
                if (!picked) return
                setLocalVideoName(picked.fileName ?? t('apply.localDefaultName'))
                setError(t('apply.localUnsupported'))
              }}
            />
            {localVideoName ? <Text style={styles.meta}>{t('apply.localPicked', { name: localVideoName })}</Text> : null}
          </DetailSection>

          <DetailSection title={t('apply.sectionSns')}>
            <View style={styles.chips}>
              {ALLOWED_SNS_PLATFORMS.map((platform) => (
                <Chip
                  key={platform}
                  label={snsPlatformLabel(platform)}
                  selected={snsPlatform === platform}
                  onPress={() => setSnsPlatform(platform)}
                />
              ))}
            </View>
            <TextField label={t('apply.snsUrl')} value={snsUrl} onChangeText={setSnsUrl} keyboardType="url" />
          </DetailSection>

          <DetailSection title={t('apply.sectionIntro')}>
            <TextField label={t('apply.intro')} value={introText} onChangeText={setIntroText} multiline />
          </DetailSection>

          {success ? <Text style={styles.success}>{success}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </KeyboardAvoidingView>
      </Screen>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  form: { gap: space.md, paddingBottom: space.md },
  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: space.xs, ...narrow.shrink },
  hint: { color: colors.muted, lineHeight: 20, fontSize: 13, ...narrow.shrink },
  meta: { color: colors.muted, fontSize: 13, ...narrow.shrink },
  label: { fontWeight: '700', color: colors.text },
  chips: { ...narrow.wrap },
  error: { color: colors.dangerText, lineHeight: 20, ...narrow.shrink },
  success: { color: colors.successText, lineHeight: 20, fontWeight: '600', ...narrow.shrink },
})
