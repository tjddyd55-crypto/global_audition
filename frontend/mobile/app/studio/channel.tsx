import { BilibiliPreview } from '../../src/features/media/BilibiliPreview'
import { bilibiliLink } from '../../../web/src/shared/audition/bilibili'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { channelApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { queryKeys } from '../../src/api/queryKeys'
import type { ChannelCareerRow, MyChannelVideoItem } from '../../src/api/types'
import { formatCount } from '../../src/i18n/format'
import { pickLibraryImage } from '../../src/features/media/pickMedia'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { ScrollChipRow } from '../../src/ui/ScrollChipRow'
import { TextField } from '../../src/ui/TextField'
import { colors, radius } from '../../src/theme/tokens'
import { PROFILE_SHOWN_FIELDS, initialShownSelection } from '../../../web/src/shared/studio/shownFields'
import {
  CAREER_CATEGORIES,
  CHANNEL_LANGUAGE_CODES,
  MAX_CHANNEL_LANGUAGES,
  formatCareerPeriod,
} from '../../../web/src/shared/channel/discovery'
import { NATIONALITY_CODES } from '../../../web/src/shared/i18n/nationalityOptions'

const FIELD_LABEL: Record<string, string> = {
  NAME: 'fieldName',
  NATIONALITY: 'fieldNationality',
  RESIDENCE: 'fieldResidence',
  AGE: 'fieldAge',
  LANGUAGES: 'fieldLanguages',
  SHORT_BIO: 'fieldShortBio',
  BIO: 'fieldBio',
  INTRO: 'fieldIntro',
  SPECIALTIES: 'fieldSpecialties',
  TALENTS: 'fieldTalents',
  CAREER: 'fieldCareer',
  ACTIVITY: 'fieldActivity',
  SNS: 'fieldSns',
  GENDER: 'fieldGender',
}

const ERROR_KEY: Record<string, string> = {
  CASTING_BIRTH_DATE_REQUIRED: 'studio.castingNeedsBirthDate',
  CASTING_MINOR_RESTRICTED: 'studio.castingMinor',
  CASTING_GUARDIAN_REQUIRED: 'studio.castingMinor',
  SEARCH_GUARDIAN_REQUIRED: 'privacy.errors.SEARCH_GUARDIAN_REQUIRED',
  YOUTUBE_URL_REQUIRED: 'studio.errYoutube',
  EMBEDDABLE_VIDEO_URL_REQUIRED: 'video.embeddableLinkRequired',
  BILIBILI_SHORT_LINK_UNAVAILABLE: 'video.shortUnavailable',
  CHANNEL_VIDEO_DUPLICATE: 'studio.errDuplicate',
  CHANNEL_VIDEO_LIMIT: 'studio.errLimit',
}

function errorKey(e: unknown): string | null {
  if (!(e instanceof ApiError)) return null
  const b = e.body as { code?: unknown; message?: unknown; error?: unknown } | null
  for (const v of [b?.code, b?.message, b?.error]) {
    if (typeof v === 'string' && ERROR_KEY[v.trim()]) return ERROR_KEY[v.trim()]
  }
  return null
}

export default function StudioChannelScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.channel, queryFn: channelApi.mine })
  const videos = useQuery({ queryKey: ['studio', 'native-videos'], queryFn: channelApi.videos })
  const [description, setDescription] = useState('')
  const [banner, setBanner] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [shown, setShown] = useState<string[]>([])
  const [residence, setResidence] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [talents, setTalents] = useState('')
  const [searchVisible, setSearchVisible] = useState(false)
  const [castingOn, setCastingOn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    const data = query.data
    if (!data) return
    setDescription(data.channelDescription ?? '')
    setBanner(data.bannerImageUrl ?? '')
    setIsPublic(Boolean(data.channelPublic ?? data.isPublic))
    setShown(initialShownSelection(data.shownFields, Boolean(data.selectionCustomized)))
    setResidence(data.residenceCountry ?? '')
    setLanguages(data.languages ?? [])
    setTalents(data.talents ?? '')
    setSearchVisible(Boolean(data.talentSearchVisible))
    setCastingOn(Boolean(data.castingOffersEnabled))
  }, [query.data])

  const data = query.data
  const castingBlocked = !data?.adultConfirmed

  return (
    <Screen loading={query.isLoading}>
      <Text style={styles.title}>{t('studio.channel')}</Text>
      <Text style={styles.hint}>{t('studio.channelHint')}</Text>
      <Text style={styles.hint}>
        {t('channel.statFollowers')} {formatCount(data?.subscriberCount ?? 0, i18n.language)} · {t('studio.videos')}{' '}
        {formatCount(data?.videoCount ?? 0, i18n.language)} · {t('channel.statViews')} {formatCount(data?.viewCount ?? 0, i18n.language)}
      </Text>
      {data?.userId ? <Button label={t('studio.viewChannel')} variant="secondary" onPress={() => router.push(`/channel/${data.userId}`)} /> : null}
      <Text style={styles.hint}>{t('studio.identityHint')}</Text>
      {!data?.selectionCustomized ? <Text style={styles.hint}>{t('studio.legacyPublic')}</Text> : null}
      <Text style={styles.label}>{t('studio.cover')}</Text>
      <View style={styles.bannerBox}>
        {banner && /^https?:\/\//.test(banner) ? <Image source={{ uri: banner }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      </View>
      <View style={styles.wrap}>
        <SmallBtn
          label={uploading ? t('studio.coverUploading') : t('studio.coverUpload')}
          onPress={async () => {
            if (uploading) return
            const picked = await pickLibraryImage()
            if (!picked) return
            setUploading(true)
            try {
              const type = picked.mimeType ?? 'image/jpeg'
              const name = picked.fileName ?? `banner.${type.split('/')[1] ?? 'jpg'}`
              setBanner(await channelApi.uploadImage({ uri: picked.uri, name, type }))
            } catch {
              setNote(t('studio.saveFailed'))
            } finally {
              setUploading(false)
            }
          }}
        />
        {banner ? <SmallBtn label={t('studio.coverRemove')} onPress={() => setBanner('')} /> : null}
      </View>
      <TextField label={t('studio.channelIntro')} value={description} onChangeText={setDescription} multiline />
      <Toggle label={t('studio.public')} on={isPublic} onToggle={() => setIsPublic((v) => !v)} />

      <Text style={styles.section}>{t('studio.portfolioTitle')}</Text>
      <Text style={styles.label}>{t('studio.residence')}</Text>
      <ScrollChipRow
        options={['', ...NATIONALITY_CODES]}
        selected={residence}
        onSelect={setResidence}
        labelOf={(c) => (c ? t(`nationality.${c}`) : t('studio.residenceNone'))}
      />
      <Text style={styles.label}>
        {t('studio.languages')} ({languages.length}/{MAX_CHANNEL_LANGUAGES})
      </Text>
      <View style={styles.wrap}>
        {CHANNEL_LANGUAGE_CODES.map((code) => {
          const on = languages.includes(code)
          const disabled = !on && languages.length >= MAX_CHANNEL_LANGUAGES
          return (
            <Pressable
              key={code}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled }}
              onPress={() => setLanguages((cur) => (on ? cur.filter((c) => c !== code) : [...cur, code]))}
              style={[styles.chip, on && styles.chipOn, disabled && styles.dim]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t(`languages.${code}`)}</Text>
            </Pressable>
          )
        })}
      </View>
      <TextField label={t('studio.talents')} value={talents} onChangeText={setTalents} placeholder={t('studio.talentsPlaceholder')} multiline />

      <Text style={styles.section}>{t('studio.shownFields')}</Text>
      <View style={styles.wrap}>
        {PROFILE_SHOWN_FIELDS.map((key) => {
          const on = shown.includes(key)
          return (
            <Pressable
              key={key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setShown((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {on ? '✓ ' : ''}
                {t(`studio.${FIELD_LABEL[key]}`)}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={styles.section}>{t('studio.discoveryTitle')}</Text>
      <Toggle label={t('studio.talentSearchVisible')} hint={t('studio.talentSearchHint')} on={searchVisible} onToggle={() => setSearchVisible((v) => !v)} />
      <Toggle
        label={t('studio.castingOffersEnabled')}
        hint={t('studio.castingHint')}
        warn={castingBlocked ? (data?.birthDateSet ? t('studio.castingMinor') : t('studio.castingNeedsBirthDate')) : undefined}
        on={castingOn}
        disabled={castingBlocked && !castingOn}
        onToggle={() => setCastingOn((v) => !v)}
      />

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
              residenceCountry: residence,
              languages,
              talents,
              talentSearchVisible: searchVisible,
              castingOffersEnabled: castingOn,
            })
            setNote(t('studio.saved'))
            await query.refetch()
          } catch (e) {
            setNote(t(errorKey(e) ?? 'studio.saveFailed'))
          } finally {
            setSaving(false)
          }
        }}
      />
      {note ? <Text style={styles.note}>{note}</Text> : null}

      <VideoManager
        videos={videos.data ?? []}
        featuredId={data?.featuredVideoId ?? null}
        max={data?.maxVideos ?? 50}
        onChanged={async () => {
          await videos.refetch()
          await qc.invalidateQueries({ queryKey: queryKeys.channel })
        }}
      />
      <CareerManager />
    </Screen>
  )
}

function Toggle({
  label,
  hint,
  warn,
  on,
  disabled,
  onToggle,
}: {
  label: string
  hint?: string
  warn?: string
  on: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={[styles.toggle, disabled && styles.dim]}
    >
      <View style={styles.flex}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.hintSmall}>{hint}</Text> : null}
        {warn ? <Text style={styles.warn}>{warn}</Text> : null}
      </View>
      <View style={[styles.switch, on && styles.switchOn]}>
        <View style={[styles.knob, on && styles.knobOn]} />
      </View>
    </Pressable>
  )
}

function VideoManager({
  videos,
  featuredId,
  max,
  onChanged,
}: {
  videos: MyChannelVideoItem[]
  featuredId: string | null
  max: number
  onChanged: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [pub, setPub] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setNote(null)
    try {
      await fn()
      await onChanged()
    } catch (e) {
      setNote(t(errorKey(e) ?? 'studio.saveFailed'))
    } finally {
      setBusy(false)
    }
  }
  const badge = (s?: string | null) =>
    s === 'OK' ? t('studio.embedOk') : s === 'NOT_FOUND' ? t('studio.embedNotFound') : s === 'RESTRICTED' ? t('studio.embedRestricted') : t('studio.embedUnknown')
  return (
    <View style={styles.box}>
      <Text style={styles.section}>{t('studio.content')}</Text>
      <Text style={styles.hintSmall}>{t('video.embeddableLinkRequired')}</Text>
      <TextField label={t('video.linkLabel')} value={url} onChangeText={setUrl} placeholder="https://youtu.be/…" keyboardType="url" />
      <BilibiliPreview value={url} />
      <TextField label={t('studio.title')} value={title} onChangeText={setTitle} />
      <Toggle label={pub ? t('studio.visibilityPublic') : t('studio.visibilityPrivate')} on={pub} onToggle={() => setPub((v) => !v)} />
      <Text style={styles.hintSmall}>
        {t('studio.videoLimit', { max })} ({videos.length}/{max})
      </Text>
      <Button
        label={t('studio.addVideo')}
        loading={busy}
        disabled={!url.trim() || !title.trim() || videos.length >= max}
        onPress={() =>
          void run(async () => {
            await channelApi.createVideo({ title: title.trim(), videoUrl: url.trim(), visibility: pub ? 'PUBLIC' : 'PRIVATE' })
            setUrl('')
            setTitle('')
          })
        }
      />
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {videos.map((v) => (
        <View key={v.videoId} style={styles.item}>
          <View style={styles.itemHead}>
            {v.thumbnailUrl ? <Image source={{ uri: v.thumbnailUrl }} style={styles.itemThumb} /> : null}
            <View style={styles.flex}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {v.title}
              </Text>
              <Text style={styles.hintSmall}>
                {v.visibility === 'PUBLIC' ? t('studio.visibilityPublic') : t('studio.visibilityPrivate')} · {badge(v.embedStatus)}
                {v.videoId === featuredId ? ` · ${t('studio.featuredBadge')}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.wrap}>
            <SmallBtn
              label={v.visibility === 'PUBLIC' ? t('studio.makePrivate') : t('studio.makePublic')}
              onPress={() => void run(() => channelApi.updateVideo(v.videoId, { visibility: v.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' }))}
            />
            {v.videoId !== featuredId ? (
              <SmallBtn label={t('studio.setFeatured')} onPress={() => void run(() => channelApi.patch({ featuredVideoId: v.videoId }))} />
            ) : null}
            {v.embedStatus !== 'OK' && !bilibiliLink(v.videoUrl) ? <SmallBtn label={t('studio.recheck')} onPress={() => void run(() => channelApi.recheckVideo(v.videoId))} /> : null}
            <SmallBtn
              danger
              label={t('studio.deleteVideo')}
              onPress={() =>
                Alert.alert(t('studio.deleteVideo'), v.title, [
                  { text: t('studio.careerCancel'), style: 'cancel' },
                  { text: t('studio.deleteVideo'), style: 'destructive', onPress: () => void run(() => channelApi.deleteVideo(v.videoId)) },
                ])
              }
            />
          </View>
        </View>
      ))}
    </View>
  )
}

const EMPTY_CAREER = { category: 'PERFORMANCE', title: '', organization: '', periodStart: '', periodEnd: '', description: '', visible: true }

function CareerManager() {
  const { t, i18n } = useTranslation()
  const careers = useQuery({ queryKey: ['studio', 'careers'], queryFn: channelApi.careers })
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<typeof EMPTY_CAREER>(EMPTY_CAREER)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const start = (c?: ChannelCareerRow) => {
    setNote(null)
    setEditing(c ? c.id : 'new')
    setDraft(
      c
        ? {
            category: c.category,
            title: c.title,
            organization: c.organization ?? '',
            periodStart: c.periodStart ?? '',
            periodEnd: c.periodEnd ?? '',
            description: c.description ?? '',
            visible: c.visible,
          }
        : EMPTY_CAREER,
    )
  }
  const run = async (fn: () => Promise<unknown>, close = false) => {
    setBusy(true)
    setNote(null)
    try {
      await fn()
      if (close) setEditing(null)
      await careers.refetch()
    } catch {
      setNote(t('studio.careerInvalid'))
    } finally {
      setBusy(false)
    }
  }
  const rows = careers.data ?? []
  return (
    <View style={styles.box}>
      <Text style={styles.section}>{t('studio.careersTitle')}</Text>
      {!rows.length && editing === null ? <Text style={styles.hintSmall}>{t('studio.careerEmpty')}</Text> : null}
      {rows.map((c) =>
        editing === c.id ? null : (
          <View key={c.id} style={styles.item}>
            <Text style={styles.hintSmall}>{t(`channel.careerCategory.${c.category}`)}</Text>
            <Text style={styles.itemTitle}>{c.title}</Text>
            <Text style={styles.hintSmall}>
              {[c.organization, formatCareerPeriod(c.periodStart, c.periodEnd, t('channel.present'))].filter(Boolean).join(' · ')}
              {!c.visible ? ` · ${t('studio.careerHidden')}` : ''}
            </Text>
            <View style={styles.wrap}>
              <SmallBtn label={c.visible ? t('studio.makePrivate') : t('studio.makePublic')} onPress={() => void run(() => channelApi.updateCareer(c.id, { visible: !c.visible }))} />
              <SmallBtn label={t('studio.careerEdit')} onPress={() => start(c)} />
              <SmallBtn danger label={t('studio.careerDelete')} onPress={() => void run(() => channelApi.deleteCareer(c.id))} />
            </View>
          </View>
        ),
      )}
      {editing === null ? (
        <Button label={t('studio.careerAdd')} variant="secondary" onPress={() => start()} />
      ) : (
        <View style={styles.item}>
          <Text style={styles.label}>{t('studio.careerCategoryLabel')}</Text>
          <ScrollChipRow
            options={CAREER_CATEGORIES}
            selected={draft.category}
            onSelect={(category) => setDraft({ ...draft, category })}
            labelOf={(c) => t(`channel.careerCategory.${c}`)}
          />
          <TextField label={t('studio.careerTitle')} value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} />
          <TextField label={t('studio.careerOrg')} value={draft.organization} onChangeText={(organization) => setDraft({ ...draft, organization })} />
          <TextField label={t('studio.careerStart')} value={draft.periodStart} placeholder="2023-03" onChangeText={(periodStart) => setDraft({ ...draft, periodStart })} />
          <TextField label={t('studio.careerEnd')} value={draft.periodEnd} placeholder="2024" onChangeText={(periodEnd) => setDraft({ ...draft, periodEnd })} />
          <TextField label={t('studio.careerDesc')} value={draft.description} multiline onChangeText={(description) => setDraft({ ...draft, description })} />
          <Toggle label={t('studio.careerVisible')} on={draft.visible} onToggle={() => setDraft({ ...draft, visible: !draft.visible })} />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button label={t('studio.careerCancel')} variant="secondary" onPress={() => setEditing(null)} />
            </View>
            <View style={styles.flex}>
              <Button
                label={t('studio.careerSave')}
                loading={busy}
                disabled={!draft.title.trim()}
                onPress={() =>
                  void run(
                    () =>
                      editing === 'new'
                        ? channelApi.createCareer({ ...draft, sourceLocale: i18n.language })
                        : channelApi.updateCareer(editing, { ...draft, sourceLocale: i18n.language }),
                    true,
                  )
                }
              />
            </View>
          </View>
          {note ? <Text style={styles.note}>{note}</Text> : null}
        </View>
      )}
    </View>
  )
}

function SmallBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.small, danger && styles.smallDanger]}>
      <Text style={[styles.smallText, danger && styles.smallDangerText]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { color: colors.muted, marginVertical: 6, lineHeight: 20 },
  hintSmall: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  warn: { color: '#b45309', fontSize: 12, lineHeight: 18, marginTop: 2 },
  note: { color: colors.text, marginVertical: 8 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 8, marginBottom: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  chip: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextOn: { color: '#fff' },
  dim: { opacity: 0.45 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  switch: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#d4d4d8', padding: 3 },
  switchOn: { backgroundColor: colors.purple },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  knobOn: { transform: [{ translateX: 18 }] },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  box: { marginTop: 12 },
  bannerBox: { height: 96, borderRadius: radius.card, overflow: 'hidden', backgroundColor: '#ece6ff' },
  item: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 12, marginTop: 10 },
  itemHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemThumb: { width: 96, height: 54, borderRadius: 6, backgroundColor: '#111' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  small: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  smallText: { fontSize: 12, fontWeight: '600', color: colors.text },
  smallDanger: { borderColor: '#fecaca' },
  smallDangerText: { color: '#b91c1c' },
})
