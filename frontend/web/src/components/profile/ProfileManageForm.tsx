'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meProfileApi, type MeProfileResponse } from '@/lib/api/meProfile'
import { calculateAge } from '@/lib/audition/calculateAge'
import { CARD_BASE, BTN_PRIMARY, TEXT_SUB } from '@/lib/ui/specClasses'

/** 백엔드 NicknamePolicy.ALLOWED 과 동일 */
const NICKNAME_ALLOWED = /^[a-zA-Z0-9가-힣._]+$/

const NATIONALITIES = [
  { value: '', label: '선택 안 함' },
  { value: 'KR', label: '대한민국' },
  { value: 'MN', label: '몽골' },
  { value: 'JP', label: '일본' },
  { value: 'OTHER', label: '기타' },
] as const

const SNS_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: '기타' },
] as const

const profileSchema = z
  .object({
    name: z.string().max(120),
    nickname: z.string().min(2, '닉네임은 2자 이상 입력해 주세요.').max(20),
    birthDate: z.string(),
    nationality: z.enum(['', 'KR', 'MN', 'JP', 'OTHER']),
    introText: z.string().max(8000),
  })
  .superRefine((data, ctx) => {
    if (data.birthDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '생년월일 형식이 올바르지 않습니다.',
        path: ['birthDate'],
      })
    }
  })

type ProfileFormValues = z.infer<typeof profileSchema>

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
      setSaveOk('저장되었습니다.')
      await queryClient.invalidateQueries({ queryKey: ['me-profile-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['me-profile', 'apply-prefill'] })
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      await queryClient.invalidateQueries({ queryKey: ['profile-page-auth-me'] })
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string } } }
      const msg = ax.response?.data?.message
      setFormError(typeof msg === 'string' ? msg : e instanceof Error ? e.message : '저장에 실패했습니다.')
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
        setFormError('SNS는 플랫폼과 URL을 함께 입력하거나, 해당 행을 삭제해 주세요.')
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
        <p className={TEXT_SUB}>프로필을 불러오는 중…</p>
      </div>
    )
  }

  if (isError || !me) {
    return (
      <div className={CARD_BASE}>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.'}
        </p>
        <button type="button" className={`${BTN_PRIMARY} mt-3`} onClick={() => refetch()}>
          다시 시도
        </button>
      </div>
    )
  }

  const blocked = saveMutation.isPending
  const canSave = isDirty && !blocked

  return (
    <form onSubmit={onSubmit} className={`${CARD_BASE} flex flex-col gap-6`}>
      <h2 className="text-lg font-bold text-neutral-900">내 정보 관리</h2>

      {saveOk ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{saveOk}</div>
      ) : null}
      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      ) : null}

      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-neutral-800">기본 정보</h3>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          이름
          <input {...form.register('name')} disabled={blocked} className={inputClass} placeholder="이름" autoComplete="name" />
          {form.formState.errors.name ? (
            <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
          ) : null}
        </label>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          닉네임
          <input {...form.register('nickname')} disabled={blocked} className={inputClass} placeholder="2~20자" />
          {form.formState.errors.nickname ? (
            <span className="text-xs text-red-600">{form.formState.errors.nickname.message}</span>
          ) : null}
        </label>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          이메일
          <input type="email" readOnly disabled value={me.email ?? ''} className={`${inputClass} bg-neutral-100 text-neutral-600`} />
        </label>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          생년월일
          <input type="date" {...form.register('birthDate')} disabled={blocked} className={inputClass} />
          {form.formState.errors.birthDate ? (
            <span className="text-xs text-red-600">{form.formState.errors.birthDate.message}</span>
          ) : null}
        </label>

        <div className="flex flex-col gap-1">
          <span className={labelClass}>나이</span>
          <div className={`${inputClass} bg-neutral-50 text-neutral-800`}>
            {watched.birthDate?.trim() && profileAge != null
              ? `${profileAge}세 (생년월일 기준 자동 계산)`
              : '생년월일을 입력하면 나이가 표시됩니다.'}
          </div>
        </div>

        <label className={`flex flex-col gap-1 ${labelClass}`}>
          국적
          <select {...form.register('nationality')} disabled={blocked} className={`${inputClass} bg-white`}>
            {NATIONALITIES.map((n) => (
              <option key={n.value === '' ? '_empty' : n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-neutral-800">SNS</h3>
          <button
            type="button"
            onClick={addSnsRow}
            disabled={blocked}
            className="shrink-0 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800 disabled:opacity-50"
          >
            + SNS 추가
          </button>
        </div>
        <p className={`${TEXT_SUB} text-xs`}>플랫폼과 URL을 함께 입력해 주세요. 저장 시 목록 전체가 교체됩니다.</p>
        <div className="flex flex-col gap-3">
          {snsRows.length === 0 ? <p className={`${TEXT_SUB} text-sm`}>등록된 SNS가 없습니다.</p> : null}
          {snsRows.map((row, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 min-[480px]:flex-row min-[480px]:items-end"
            >
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-neutral-600">
                플랫폼
                <select
                  value={row.platform}
                  onChange={(e) => updateSnsRow(index, { platform: e.target.value })}
                  disabled={blocked}
                  className={`${inputClass} py-2 text-sm`}
                >
                  {SNS_PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
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
                삭제
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <label className={labelClass}>자기소개</label>
        <textarea
          {...form.register('introText')}
          disabled={blocked}
          rows={8}
          className={`${inputClass} resize-y`}
          placeholder="자기소개를 입력해 주세요."
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
        {blocked ? '저장 중…' : '저장하기'}
      </button>
    </form>
  )
}
