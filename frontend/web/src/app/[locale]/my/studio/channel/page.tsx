'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { channelApi } from '@/shared/api/channel'
import { videoApi } from '@/shared/api/videos'
import { formatCount } from '@/shared/money/currency'
import { initialShownSelection, PROFILE_SHOWN_FIELDS, type ProfileShownField } from '@/shared/studio/shownFields'
import { INPUT_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const FIELD_LABEL: Record<ProfileShownField, 'fieldName' | 'fieldNationality' | 'fieldShortBio' | 'fieldBio' | 'fieldIntro' | 'fieldSpecialties' | 'fieldCareer' | 'fieldActivity' | 'fieldSns'> = {
  NAME: 'fieldName',
  NATIONALITY: 'fieldNationality',
  SHORT_BIO: 'fieldShortBio',
  BIO: 'fieldBio',
  INTRO: 'fieldIntro',
  SPECIALTIES: 'fieldSpecialties',
  CAREER: 'fieldCareer',
  ACTIVITY: 'fieldActivity',
  SNS: 'fieldSns',
}

export default function StudioChannelPage() {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const channel = useQuery({ queryKey: ['studio', 'channel'], queryFn: channelApi.getMine })
  const videos = useQuery({ queryKey: ['studio', 'videos'], queryFn: videoApi.getMyChannelVideos })
  const [description, setDescription] = useState('')
  const [banner, setBanner] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [featured, setFeatured] = useState('')
  const [shown, setShown] = useState<ProfileShownField[]>([])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const data = channel.data
    if (!data) return
    setDescription(data.channelDescription ?? '')
    setBanner(data.bannerImageUrl ?? '')
    setIsPublic(Boolean(data.channelPublic ?? data.isPublic))
    setFeatured(data.featuredVideoId ?? '')
    setShown(initialShownSelection(data.shownFields, Boolean(data.selectionCustomized)))
  }, [channel.data])

  const save = useMutation({
    mutationFn: () =>
      channelApi.patchMine({
        channelDescription: description,
        bannerImageUrl: banner.trim() === '' ? null : banner.trim(),
        isChannelPublic: isPublic,
        shownFields: shown,
        featuredVideoId: featured,
      }),
    onSuccess: async () => {
      setMessage(t('saved'))
      await queryClient.invalidateQueries({ queryKey: ['studio', 'channel'] })
    },
    onError: () => setMessage(t('saveFailed')),
  })

  if (channel.isLoading) return <p className={TEXT_SUB}>{t('loginRequired')}</p>
  if (channel.isError || !channel.data) return <p className="text-sm text-red-600">{t('saveFailed')}</p>
  const data = channel.data
  const reference: Record<ProfileShownField, string> = {
    NAME: data.name ?? '',
    NATIONALITY: data.nationality ?? '',
    SHORT_BIO: data.shortBio ?? '',
    BIO: data.bio ?? '',
    INTRO: data.introText ?? '',
    SPECIALTIES: (data.categories ?? []).join(', '),
    CAREER: data.careerText ?? '',
    ACTIVITY: (data.activityFields ?? []).join(', '),
    SNS: (data.snsLinks ?? []).map((row) => `${row.platform} ${row.url}`).join(', '),
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setMessage(null)
        save.mutate()
      }}
    >
      <h2 className={TITLE_PAGE}>{t('channel')}</h2>
      <p className={TEXT_SUB}>{t('channelHint')}</p>
      <p className={TEXT_SUB}>
        {t('subscribers')} {formatCount(data.subscriberCount, locale)} · {t('videos')} {formatCount(data.videoCount, locale)} · {t('views')}{' '}
        {formatCount(data.viewCount, locale)}
      </p>
      {!data.selectionCustomized ? <p className={TEXT_SUB}>{t('legacyPublic')}</p> : null}
      <label className="text-sm font-medium">
        {t('cover')}
        <input className={INPUT_BASE} value={banner} onChange={(e) => setBanner(e.target.value)} />
      </label>
      <label className="text-sm font-medium">
        {t('channelIntro')}
        <textarea className={INPUT_BASE} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
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
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">{t('shownFields')}</legend>
        {PROFILE_SHOWN_FIELDS.map((key) => (
          <label key={key} className="rounded-lg border border-neutral-200 p-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={shown.includes(key)}
                onChange={(event) => {
                  setShown((current) =>
                    event.target.checked ? [...current, key] : current.filter((item) => item !== key),
                  )
                }}
              />
              {t(FIELD_LABEL[key])}
            </span>
            <span className={`mt-1 block ${TEXT_SUB}`}>
              {t('referenced')}: {reference[key].trim() || t('emptyReference')}
            </span>
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={save.isPending} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {tCommon('save')}
      </button>
      {message ? <p className={TEXT_SUB}>{message}</p> : null}
    </form>
  )
}
