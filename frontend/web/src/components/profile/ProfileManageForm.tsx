'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { meProfileApi, type MeProfileResponse } from '@/shared/api/meProfile'
import { calculateAge } from '@/shared/audition/calculateAge'
import { nationalityOptionValues } from '@/shared/i18n/nationalityOptions'
import { CARD_BASE, BTN_PRIMARY, TEXT_SUB } from '@/shared/ui/specClasses'

const SNS_PLATFORM_VALUES = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'other'] as const

const SNS_PLATFORM_LABELS: Record<(typeof SNS_PLATFORM_VALUES)[number], string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X (Twitter)',
  facebook: 'Facebook',
  other: 'other',
}

function createProfileSchema(nicknameMin: string, birthFormat: string) {
  return z
    .object({
      name: z.string().max(120),
      nickname: z.string().min(2, nicknameMin).max(20),
      birthDate: z.string(),
      nationality: z.enum(['', 'KR', 'MN', 'JP', 'OTHER']),
      introText: z.string().max(8000),
    })
    .superRefine((data, ctx) => {
      if (data.birthDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: birthFormat,
          path: ['birthDate'],
        })
      }
    })
}

type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>

type SnsRow = { platform: string; url: string }

function normalizeNationality(raw: string | null | undefined): '' | 'KR' | 'MN' | 'JP' | 'OTHER' {
  const n = (raw ?? '').trim().toUpperCase()
  if (n === 'KR' || n === 'MN' || n === 'JP' || n === 'OTHER') return n
  return ''
}

function applyMeToForm(me: MeProfileResponse): ProfileFormValues {
  return {
    name: me.name?.trim() ?? '',
    nickname: me.nickname?.trim() ?? '',
    birthDate: me.birthDate?.trim() ?? '',
    nationality: normalizeNationality(me.nationality),
    introText: me.introText?.trim() ?? '',
  }
}

function snsFromMe(me: MeProfileResponse): SnsRow[] {
  const links = me.snsLinks ?? []
  if (links.length === 0) return []
  return links.map((l) => ({
    platform: (l.platform ?? 'instagram').trim().toLowerCase(),
    url: (l.url ?? '').trim(),
  }))
}

function snapshotForDirty(values: ProfileFormValues, sns: SnsRow[]): string {
  return JSON.stringify({
    name: values.name.trim(),
    nickname: values.nickname.trim(),
    birthDate: values.birthDate.trim(),
    nationality: values.nationality,
    introText: values.introText.trim(),
    sns: sns.map((r) => ({
      platform: r.platform.trim().toLowerCase(),
      url: r.url.trim(),
    })),
  })
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100'
const labelClass = 'text-sm font-medium text-neutral-700'

export function ProfileManageForm() {
  const queryClient = useQueryClient()
  const tProfile = useTranslations('profile')
  const tChannel = useTranslations('channel')
  const tApply = useTranslations('apply')
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tNat = useTranslations('nationality')
  const profileSchema = useMemo(
    () => createProfileSchema(tProfile('nicknameMin'), tProfile('birthFormat')),
    [tProfile],
  )
  const [snsRows, setSnsRows] = useState<SnsRow[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  const baselineJsonRef = useRef<string | null>(null)

  const { data: me, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['me-profile-manage'],
    queryFn: () => meProfileApi.get(),
    retry: false,
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      nickname: '',
      birthDate: '',
      nationality: '',
      introText: '',
    },
  })

  useEffect(() => {
    if (!me) return
    const nextValues = applyMeToForm(me)
    const nextSns = snsFromMe(me)
    form.reset(nextValues)
    setSnsRows(nextSns)
    baselineJsonRef.current = snapshotForDirty(nextValues, nextSns)
  }, [me, form])

  const watched = form.watch()
  const profileAge = useMemo(() => {
    const b = watched.birthDate?.trim() ?? ''
    if (!b) return null
    const a = calculateAge(b)
    return a != null && a >= 0 ? a : null
  }, [watched.birthDate])

  const isDirty = useMemo(() => {
    if (baselineJsonRef.current == null) return false
    return snapshotForDirty(watched, snsRows) !== baselineJsonRef.current
  }, [watched, snsRows])

  useEffect(() => {
    if (isDirty && saveOk) setSaveOk(null)
  }, [isDirty, saveOk])

  const saveMutation = useMutation({
    mutationFn: meProfileApi.patch,
    onSuccess: async () => {
      setFormError(null)
      setSaveOk(tChannel('saved'))
      await queryClient.invalidateQueries({ queryKey: ['me-profile-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['me-profile', 'apply-prefill'] })
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      await queryClient.invalidateQueries({ queryKey: ['profile-page-auth-me'] })
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      const msg = ax.response?.data?.message
      setFormError(typeof msg === 'string' ? msg : e instanceof Error ? e.message : tChannel('saveFailed'))
      setSaveOk(null)
    },
  })

  const addSnsRow = () => setSnsRows((rows) => [...rows, { platform: 'instagram', url: '' }])
  const removeSnsRow = (index: number) => setSnsRows((rows) => rows.filter((_, i) => i !== index))
  const updateSnsRow = (index: number, patch: Partial<SnsRow>) => {
    setSnsRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    setSaveOk(null)

    const normalizedSns: Array<{ platform: string; url: string }> = []
    for (const row of snsRows) {
      const p = row.platform.trim().toLowerCase()
      const u = row.url.trim()
      if (!p && !u) continue
      if (!p || !u) {
        setFormError(tProfile('snsPairRequired'))
        return
      }
      normalizedSns.push({ platform: p, url: u })
    }

    const nameTrim = values.name.trim()
    saveMutation.mutate({
      name: nameTrim.length > 0 ? nameTrim : null,
      nickname: values.nickname.trim(),
      birthDate: values.birthDate.trim(),
      nationality: values.nationality,
      introText: values.introText.trim(),
      snsLinks: normalizedSns,
    })
  })

  if (isLoading) {
    return (
      <div className={CARD_BASE}>
        <p className={TEXT_SUB}>{tChannel('loadingProfile')}</p>
      </div>
    )
  }

  if (isError || !me) {
    return (
      <div className={CARD_BASE}>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : tProfile('loadFailed')}
        </p>
        <button type="button" className={`${BTN_PRIMARY} mt-3`} onClick={() => refetch()}>
          {tCommon('retry')}
        </button>
      </div>
    )
  }

  const blocked = saveMutation.isPending
  const canSave = isDirty && !blocked

  return (
    <form onSubmit={onSubmit} className={`${CARD_BASE} flex flex-col gap-6`}>
      <h2 className="text-lg font-bold text-neutral-900">{tProfile('manageTitle')}</h2>

      {saveOk ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{saveOk}</div>
      ) : null}
      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      ) : null}

      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-neutral-800">{tApply('sectionBasic')}</h3>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          {tProfile('name')}
          <input {...form.register('name')} disabled={blocked} className={inputClass} placeholder={tProfile('name')} autoComplete="name" />
          {form.formState.errors.name ? (
            <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
          ) : null}
        </label>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          {tProfile('nickname')}
          <input {...form.register('nickname')} disabled={blocked} className={inputClass} placeholder={tProfile('nicknamePlaceholder')} />
          {form.formState.errors.nickname ? (
            <span className="text-xs text-red-600">{form.formState.errors.nickname.message}</span>
          ) : null}
        </label>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          {tAuth('email')}
          <input type="email" readOnly disabled value={me.email ?? ''} className={`${inputClass} bg-neutral-100 text-neutral-600`} />
        </label>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          {tApply('birthDate')}
          <input type="date" {...form.register('birthDate')} disabled={blocked} className={inputClass} />
          {form.formState.errors.birthDate ? (
            <span className="text-xs text-red-600">{form.formState.errors.birthDate.message}</span>
          ) : null}
        </label>

        <div className="flex flex-col gap-1">
          <span className={labelClass}>{tApply('age')}</span>
          <div className={`${inputClass} bg-neutral-50 text-neutral-800`}>
            {watched.birthDate?.trim() && profileAge != null
              ? tProfile('ageAuto', { age: profileAge })
              : tApply('ageHint')}
          </div>
        </div>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          {tApply('nationality')}
          <select {...form.register('nationality')} disabled={blocked} className={`${inputClass} bg-white`}>
            {nationalityOptionValues().map((code) => (
              <option key={code === '' ? '_empty' : code} value={code}>
                {code === '' ? tNat('unspecified') : tNat(code)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-neutral-800">{tChannel('sns')}</h3>
          <button
            type="button"
            onClick={addSnsRow}
            disabled={blocked}
            className="shrink-0 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800 disabled:opacity-50"
          >
            {tChannel('addSns')}
          </button>
        </div>
        <p className={`${TEXT_SUB} text-xs`}>{tProfile('snsHint')}</p>
        <div className="flex flex-col gap-3">
          {snsRows.length === 0 ? <p className={`${TEXT_SUB} text-sm`}>{tProfile('snsEmpty')}</p> : null}
          {snsRows.map((row, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 min-[480px]:flex-row min-[480px]:items-end"
            >
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-neutral-600">
                {tApply('snsPlatform')}
                <select
                  value={row.platform}
                  onChange={(e) => updateSnsRow(index, { platform: e.target.value })}
                  disabled={blocked}
                  className={`${inputClass} py-2 text-sm`}
                >
                  {SNS_PLATFORM_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {value === 'other' ? tChannel('snsOther') : SNS_PLATFORM_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-[2] flex-col gap-1 text-xs font-medium text-neutral-600">
                URL
                <input
                  type="url"
                  value={row.url}
                  onChange={(e) => updateSnsRow(index, { url: e.target.value })}
                  disabled={blocked}
                  className={`${inputClass} py-2 text-sm`}
                  placeholder="https://"
                />
              </label>
              <button
                type="button"
                onClick={() => removeSnsRow(index)}
                disabled={blocked}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-red-600"
              >
                {tCommon('delete')}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <label className={labelClass}>{tApply('intro')}</label>
        <textarea
          {...form.register('introText')}
          disabled={blocked}
          rows={8}
          className={`${inputClass} resize-y`}
          placeholder={tProfile('introPlaceholder')}
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{form.formState.errors.introText?.message}</span>
          <span>{form.watch('introText')?.length ?? 0} / 8000</span>
        </div>
      </section>

      <button
        type="submit"
        disabled={!canSave}
        className={`${BTN_PRIMARY} h-11 w-full sm:w-auto sm:min-w-[140px] disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {blocked ? tChannel('saving') : tChannel('save')}
      </button>
    </form>
  )
}
