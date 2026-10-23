'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { meProfileApi } from '@/shared/api/meProfile'
import { uploadAuditionImage } from '@/shared/api/uploads'
import { INPUT_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const NATIONALITIES = ['', 'KR', 'MN', 'JP', 'OTHER'] as const

export default function StudioProfilePage() {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['studio', 'profile'], queryFn: meProfileApi.get })
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState('')
  const [introText, setIntroText] = useState('')
  const [shortBio, setShortBio] = useState('')
  const [bio, setBio] = useState('')
  const [careerText, setCareerText] = useState('')
  const [activity, setActivity] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [sns, setSns] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const me = query.data
    if (!me) return
    setName(me.name ?? '')
    setNickname(me.nickname ?? '')
    setBirthDate(me.birthDate ?? '')
    setNationality(me.nationality ?? me.country ?? '')
    setIntroText(me.introText ?? '')
    setShortBio(me.shortBio ?? '')
    setBio(me.bio ?? '')
    setCareerText(me.careerText ?? '')
    setActivity((me.activityFields ?? []).join('\n'))
    setSpecialties((me.categories ?? []).join('\n'))
    setProfileImageUrl(me.profileImageUrl ?? '')
    setSns((me.snsLinks ?? []).map((row) => `${row.platform} ${row.url}`).join('\n'))
  }, [query.data])

  const save = useMutation({
    mutationFn: () =>
      meProfileApi.patch({
        name,
        nickname: nickname.trim(),
        birthDate,
        nationality,
        introText,
        shortBio,
        bio,
        careerText,
        activityFields: activity
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
        categories: specialties
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .slice(0, 3),
        profileImageUrl: profileImageUrl.trim() === '' ? null : profileImageUrl.trim(),
        snsLinks: sns
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => {
            const space = line.indexOf(' ')
            if (space < 0) return null
            return { platform: line.slice(0, space).trim(), url: line.slice(space + 1).trim() }
          })
          .filter((row): row is { platform: string; url: string } => Boolean(row && row.platform && row.url)),
      }),
    onSuccess: async () => {
      setMessage(t('saved'))
      await queryClient.invalidateQueries({ queryKey: ['studio', 'profile'] })
      await queryClient.invalidateQueries({ queryKey: ['studio', 'channel'] })
    },
    onError: () => setMessage(t('saveFailed')),
  })

  if (query.isLoading) return <p className={TEXT_SUB}>{t('loginRequired')}</p>
  if (query.isError) return <p className="text-sm text-red-600">{t('saveFailed')}</p>

  return (
    <form
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setMessage(null)
        save.mutate()
      }}
    >
      <h2 className={TITLE_PAGE}>{t('profile')}</h2>
      <p className={TEXT_SUB}>{t('profileHint')}</p>
      <label className="text-sm font-medium">
        {t('name')}
        <input className={INPUT_BASE} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="text-sm font-medium">
        {t('nickname')}
        <input className={INPUT_BASE} value={nickname} onChange={(e) => setNickname(e.target.value)} required />
      </label>
      <label className="text-sm font-medium">
        {t('birthDate')}
        <input className={INPUT_BASE} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </label>
      <label className="text-sm font-medium">
        {t('nationality')}
        <select className={INPUT_BASE} value={nationality} onChange={(e) => setNationality(e.target.value)}>
          {NATIONALITIES.map((code) => (
            <option key={code || 'empty'} value={code}>
              {code || '—'}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        {t('profileImage')}
        <input className={INPUT_BASE} value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} />
        <input
          className="mt-2 block text-sm"
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            try {
              const url = await uploadAuditionImage(file, 'profile')
              setProfileImageUrl(url)
            } catch {
              setMessage(t('saveFailed'))
            }
          }}
        />
      </label>
      <label className="text-sm font-medium">
        {t('shortBio')}
        <input className={INPUT_BASE} maxLength={30} value={shortBio} onChange={(e) => setShortBio(e.target.value)} />
      </label>
      <label className="text-sm font-medium">
        {t('intro')}
        <textarea className={INPUT_BASE} rows={3} value={introText} onChange={(e) => setIntroText(e.target.value)} />
      </label>
      <label className="text-sm font-medium">
        {t('bio')}
        <textarea className={INPUT_BASE} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
      </label>
      <label className="text-sm font-medium">
        {t('career')}
        <textarea className={INPUT_BASE} rows={4} value={careerText} onChange={(e) => setCareerText(e.target.value)} />
      </label>
      <label className="text-sm font-medium">
        {t('specialties')}
        <textarea className={INPUT_BASE} rows={3} value={specialties} onChange={(e) => setSpecialties(e.target.value)} />
        <span className={TEXT_SUB}>{t('specialtiesHint')}</span>
      </label>
      <label className="text-sm font-medium">
        {t('activity')}
        <textarea className={INPUT_BASE} rows={4} value={activity} onChange={(e) => setActivity(e.target.value)} />
        <span className={TEXT_SUB}>{t('activityHint')}</span>
      </label>
      <label className="text-sm font-medium">
        {t('sns')}
        <textarea className={INPUT_BASE} rows={4} value={sns} onChange={(e) => setSns(e.target.value)} placeholder="YOUTUBE https://" />
        <span className={TEXT_SUB}>{t('snsHint')}</span>
      </label>
      <button type="submit" disabled={save.isPending} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {tCommon('save')}
      </button>
      {message ? <p className={TEXT_SUB}>{message}</p> : null}
    </form>
  )
}
