import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { channelApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { formatCount } from '../../src/i18n/format'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { colors } from '../../src/theme/tokens'
import { PROFILE_SHOWN_FIELDS, initialShownSelection } from '../../../web/src/shared/studio/shownFields'

export default function StudioChannelScreen() {
  const { t, i18n } = useTranslation()
  const query = useQuery({ queryKey: queryKeys.channel, queryFn: channelApi.mine })
  const [description, setDescription] = useState('')
  const [banner, setBanner] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [shown, setShown] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    const data = query.data
    if (!data) return
    setDescription(data.channelDescription ?? '')
    setBanner(data.bannerImageUrl ?? '')
    setIsPublic(Boolean(data.channelPublic ?? data.isPublic))
    setShown(initialShownSelection(data.shownFields, Boolean(data.selectionCustomized)))
  }, [query.data])

  const reference = (key: string) => {
    const data = query.data
    if (!data) return ''
    if (key === 'NAME') return data.name ?? ''
    if (key === 'NATIONALITY') return data.nationality ?? ''
    if (key === 'SHORT_BIO') return data.shortBio ?? ''
    if (key === 'BIO') return data.bio ?? ''
    if (key === 'INTRO') return data.introText ?? ''
    if (key === 'SPECIALTIES') return (data.categories ?? []).join(', ')
    if (key === 'CAREER') return data.careerText ?? ''
    if (key === 'ACTIVITY') return (data.activityFields ?? []).join(', ')
    if (key === 'SNS') return (data.snsLinks ?? []).map((row) => row.url).join(', ')
    return ''
  }

  return (
    <Screen loading={query.isLoading}>
      <Text style={styles.title}>{t('studio.channel')}</Text>
      <Text style={styles.hint}>{t('studio.channelHint')}</Text>
      <Text style={styles.hint}>
        {t('studio.subscribers')} {formatCount(query.data?.subscriberCount ?? 0, i18n.language)} · {t('studio.videos')}{' '}
        {formatCount(query.data?.videoCount ?? 0, i18n.language)}
      </Text>
      {!query.data?.selectionCustomized ? <Text style={styles.hint}>{t('studio.legacyPublic')}</Text> : null}
      <TextField label={t('studio.cover')} value={banner} onChangeText={setBanner} />
      <TextField label={t('studio.channelIntro')} value={description} onChangeText={setDescription} multiline />
      <Button
        label={`${t('studio.public')} ${isPublic ? 'ON' : 'OFF'}`}
        variant={isPublic ? 'primary' : 'secondary'}
        onPress={() => setIsPublic((value) => !value)}
      />
      <Text style={styles.hint}>{t('studio.shownFields')}</Text>
      {PROFILE_SHOWN_FIELDS.map((key) => {
        const on = shown.includes(key)
        const value = reference(key).trim()
        return (
          <View key={key} style={styles.row}>
            <Button
              label={`${on ? '✓ ' : ''}${t(`studio.field${labelKey(key)}`)}`}
              variant={on ? 'primary' : 'secondary'}
              onPress={() =>
                setShown((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))
              }
            />
            <Text style={styles.hint}>{value || t('studio.emptyReference')}</Text>
          </View>
        )
      })}
      <Button
        label={t('common.save')}
        loading={saving}
        onPress={async () => {
          setSaving(true)
          setNote(null)
          try {
            await channelApi.patch({
              channelDescription: description,
              bannerImageUrl: banner.trim() === '' ? null : banner.trim(),
              isChannelPublic: isPublic,
              shownFields: shown,
            })
            setNote(t('studio.saved'))
            await query.refetch()
          } catch {
            setNote(t('studio.saveFailed'))
          } finally {
            setSaving(false)
          }
        }}
      />
      {note ? <Text style={styles.hint}>{note}</Text> : null}
    </Screen>
  )
}

function labelKey(key: string): string {
  if (key === 'SHORT_BIO') return 'ShortBio'
  if (key === 'BIO') return 'Bio'
  if (key === 'INTRO') return 'Intro'
  if (key === 'SPECIALTIES') return 'Specialties'
  if (key === 'CAREER') return 'Career'
  if (key === 'ACTIVITY') return 'Activity'
  if (key === 'SNS') return 'Sns'
  if (key === 'NATIONALITY') return 'Nationality'
  return 'Name'
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { color: colors.muted, marginVertical: 6, lineHeight: 20 },
  row: { marginBottom: 8 },
})
