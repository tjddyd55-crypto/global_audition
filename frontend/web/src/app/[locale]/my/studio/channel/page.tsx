'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { channelApi } from '@/shared/api/channel'
import { videoApi } from '@/shared/api/videos'
import { uploadAuditionImage } from '@/shared/api/uploads'
import { formatCount } from '@/shared/money/currency'
import { apiErrorCode } from '@/shared/channel/apiErrorCode'
import { CHANNEL_LANGUAGE_CODES, MAX_CHANNEL_LANGUAGES } from '@/shared/channel/discovery'
import { NATIONALITY_CODES } from '@/shared/i18n/nationalityOptions'
import { initialShownSelection, PROFILE_SHOWN_FIELDS, type ProfileShownField } from '@/shared/studio/shownFields'
import { INPUT_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'
import { ChannelCareerEditor } from '@/components/studio/ChannelCareerEditor'

const FIELD_LABEL: Record<ProfileShownField, string> = {
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
  CASTING_BIRTH_DATE_REQUIRED: 'castingNeedsBirthDate',
  CASTING_MINOR_RESTRICTED: 'castingMinor',
  CASTING_GUARDIAN_REQUIRED: 'castingMinor',
}

export default function StudioChannelPage() {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const tNat = useTranslations('nationality')
  const tLang = useTranslations('languages')
  const tChannel = useTranslations('channel')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const channel = useQuery({ queryKey: ['studio', 'channel'], queryFn: channelApi.getMine })
  const videos = useQuery({ queryKey: ['studio', 'videos'], queryFn: videoApi.getMyChannelVideos })
  const [description, setDescription] = useState('')
  const [banner, setBanner] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [featured, setFeatured] = useState('')
  const [shown, setShown] = useState<ProfileShownField[]>([])
  const [residence, setResidence] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [talents, setTalents] = useState('')
  const [searchVisible, setSearchVisible] = useState(false)
  const [castingOn, setCastingOn] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const data = channel.data
    if (!data) return
    setDescription(data.channelDescription ?? '')
    setBanner(data.bannerImageUrl ?? '')
    setIsPublic(Boolean(data.channelPublic ?? data.isPublic))
    setFeatured(data.featuredVideoId ?? '')
    setShown(initialShownSelection(data.shownFields, Boolean(data.selectionCustomized)))
    setResidence(data.residenceCountry ?? '')
    setLanguages(data.languages ?? [])
    setTalents(data.talents ?? '')
    setSearchVisible(Boolean(data.talentSearchVisible))
    setCastingOn(Boolean(data.castingOffersEnabled))
  }, [channel.data])

  const save = useMutation({
    mutationFn: () =>
      channelApi.patchMine({
        channelDescription: description,
        bannerImageUrl: banner.trim() === '' ? null : banner.trim(),
        isChannelPublic: isPublic,
        shownFields: shown,
        featuredVideoId: featured,
        residenceCountry: residence,
        languages,
        talents,
        talentSearchVisible: searchVisible,
        castingOffersEnabled: castingOn,
      }),
    onSuccess: async () => {
      setMessage(t('saved'))
      await queryClient.invalidateQueries({ queryKey: ['studio', 'channel'] })
    },
    onError: (e) => {
      const key = ERROR_KEY[apiErrorCode(e)]
      setMessage(key ? t(key) : t('saveFailed'))
    },
  })

  const onBanner = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      setBanner(await uploadAuditionImage(file, 'profile'))
    } catch {
      setMessage(t('saveFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (channel.isLoading) return <p className={TEXT_SUB}>{t('loginRequired')}</p>
  if (channel.isError || !channel.data) return <p className="text-sm text-red-600">{t('saveFailed')}</p>
  const data = channel.data
  const castingBlocked = !data.adultConfirmed
  const reference: Record<ProfileShownField, string> = {
    NAME: data.name ?? '',
    NATIONALITY: data.nationality ? tNat(data.nationality as never) : '',
    RESIDENCE: residence ? tNat(residence as never) : '',
    AGE: data.ageBand ? tChannel(`ageBand.${data.ageBand}`) : '',
    LANGUAGES: languages.map((l) => tLang(l)).join(', '),
    SHORT_BIO: data.shortBio ?? '',
    BIO: data.bio ?? '',
    INTRO: data.introText ?? '',
    SPECIALTIES: (data.categories ?? []).join(', '),
    TALENTS: talents,
    CAREER: data.careerText ?? '',
    ACTIVITY: (data.activityFields ?? []).join(', '),
    SNS: (data.snsLinks ?? []).map((row) => `${row.platform} ${row.url}`).join(', '),
    GENDER: '',
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <form
        className="flex flex-col gap-4"
        data-testid="studio-channel-form"
        onSubmit={(event) => {
          event.preventDefault()
          setMessage(null)
          save.mutate()
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={TITLE_PAGE}>{t('channel')}</h2>
          {data.userId ? (
            <Link href={`/channel/${data.userId}`} className="text-sm font-semibold text-violet-700 underline-offset-2 hover:underline">
              {t('viewChannel')}
            </Link>
          ) : null}
        </div>
        <p className={TEXT_SUB}>{t('channelHint')}</p>
        <p className={TEXT_SUB}>
          {tChannel('statFollowers')} {formatCount(data.subscriberCount, locale)} · {t('videos')} {formatCount(data.videoCount, locale)} · {tChannel('statViews')}{' '}
          {formatCount(data.viewCount, locale)}
        </p>
        <p className={TEXT_SUB}>
          {t('identityHint')}{' '}
          <Link href="/my/studio/profile" className="font-semibold text-violet-700 underline">
            {t('profile')}
          </Link>
        </p>
        {!data.selectionCustomized ? <p className={TEXT_SUB}>{t('legacyPublic')}</p> : null}

        <section className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('cover')}</span>
          <div className="relative h-28 w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-200 via-fuchsia-100 to-amber-100 sm:h-36">
            {banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onBanner(e.target.files?.[0])} data-testid="banner-file" />
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="h-9 rounded-full border border-neutral-300 px-3 text-sm font-semibold disabled:opacity-50">
              {uploading ? t('coverUploading') : t('coverUpload')}
            </button>
            {banner ? (
              <button type="button" onClick={() => setBanner('')} className="h-9 rounded-full border border-neutral-300 px-3 text-sm">
                {t('coverRemove')}
              </button>
            ) : null}
          </div>
        </section>

        <label className="text-sm font-medium">
          {t('channelIntro')}
          <textarea className={INPUT_BASE} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} data-testid="channel-public-toggle" />
          {t('public')}
        </label>
        <label className="text-sm font-medium">
          {t('featured')}
          <select className={INPUT_BASE} value={featured} onChange={(e) => setFeatured(e.target.value)}>
            <option value="">—</option>
            {(videos.data?.content ?? []).map((video) => (
              <option key={video.id} value={video.id}>
                {video.title}
              </option>
            ))}
          </select>
        </label>

        <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
          <h3 className="text-base font-semibold">{t('portfolioTitle')}</h3>
          <label className="text-sm font-medium">
            {t('residence')}
            <select className={INPUT_BASE} value={residence} onChange={(e) => setResidence(e.target.value)} data-testid="residence-select">
              <option value="">{t('residenceNone')}</option>
              {NATIONALITY_CODES.map((c) => (
                <option key={c} value={c}>
                  {tNat(c)}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-medium">
              {t('languages')} ({languages.length}/{MAX_CHANNEL_LANGUAGES})
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHANNEL_LANGUAGE_CODES.map((code) => {
                const on = languages.includes(code)
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && languages.length >= MAX_CHANNEL_LANGUAGES}
                    onClick={() => setLanguages((cur) => (on ? cur.filter((c) => c !== code) : [...cur, code]))}
                    className={`h-8 rounded-full px-3 text-xs font-semibold disabled:opacity-40 ${on ? 'bg-violet-600 text-white' : 'border border-neutral-300'}`}
                  >
                    {tLang(code)}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <label className="text-sm font-medium">
            {t('talents')}
            <textarea className={INPUT_BASE} rows={2} maxLength={500} placeholder={t('talentsPlaceholder')} value={talents} onChange={(e) => setTalents(e.target.value)} />
          </label>
        </section>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">{t('shownFields')}</legend>
          {PROFILE_SHOWN_FIELDS.map((key) => (
            <label key={key} className="rounded-lg border border-neutral-200 p-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={shown.includes(key)}
                  onChange={(event) => {
                    setShown((current) => (event.target.checked ? [...current, key] : current.filter((item) => item !== key)))
                  }}
                />
                {t(FIELD_LABEL[key])}
              </span>
              <span className={`mt-1 block break-words ${TEXT_SUB}`}>
                {t('referenced')}: {reference[key].trim() || t('emptyReference')}
              </span>
            </label>
          ))}
        </fieldset>

        <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4" data-testid="studio-discovery">
          <h3 className="text-base font-semibold">{t('discoveryTitle')}</h3>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={searchVisible} onChange={(e) => setSearchVisible(e.target.checked)} data-testid="talent-search-toggle" />
            <span>
              <span className="font-medium">{t('talentSearchVisible')}</span>
              <span className={`block ${TEXT_SUB}`}>{t('talentSearchHint')}</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={castingOn}
              disabled={castingBlocked && !castingOn}
              onChange={(e) => setCastingOn(e.target.checked)}
              data-testid="casting-toggle"
            />
            <span>
              <span className="font-medium">{t('castingOffersEnabled')}</span>
              <span className={`block ${TEXT_SUB}`}>{t('castingHint')}</span>
              {castingBlocked ? (
                <span className="mt-1 block text-xs text-amber-700">
                  {data.birthDateSet ? t('castingMinor') : t('castingNeedsBirthDate')}
                </span>
              ) : null}
            </span>
          </label>
        </section>

        <button type="submit" disabled={save.isPending} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" data-testid="studio-channel-save">
          {tCommon('save')}
        </button>
        {message ? <p className={TEXT_SUB} role="status">{message}</p> : null}
      </form>
      <ChannelCareerEditor />
    </div>
  )
}
