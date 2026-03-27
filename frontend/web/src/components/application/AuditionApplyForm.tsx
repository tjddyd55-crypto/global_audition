'use client'

import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { calculateAge } from '@/lib/audition/calculateAge'

const NATIONALITIES = [
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

const formSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일을 선택해 주세요.'),
  nationality: z.enum(['KR', 'MN', 'JP', 'OTHER']),
  videoUrl: z.string().min(1, '영상 링크를 입력해 주세요.'),
  introText: z.string().min(50, '지원 동기·자기소개는 50자 이상 입력해 주세요.').max(10000),
})

export type AuditionApplyFormValues = z.infer<typeof formSchema>

export type SnsRow = { platform: string; url: string }

type Props = {
  auditionId: string
  disabled?: boolean
  onSubmit: (payload: {
    auditionId: string
    name: string
    birthDate: string
    age: number
    nationality: string
    videoUrl: string
    introText: string
    snsLinks: Array<{ platform: string; url: string }>
  }) => Promise<void>
}

export function AuditionApplyForm({ auditionId, disabled, onSubmit }: Props) {
  const [snsRows, setSnsRows] = useState<SnsRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<AuditionApplyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      birthDate: '',
      nationality: 'KR',
      videoUrl: '',
      introText: '',
    },
  })

  const birthDate = useWatch({ control: form.control, name: 'birthDate' })
  const computedAge = useMemo(() => (birthDate ? calculateAge(birthDate) : null), [birthDate])

  const addSnsRow = () => setSnsRows((rows) => [...rows, { platform: 'instagram', url: '' }])

  const removeSnsRow = (index: number) => setSnsRows((rows) => rows.filter((_, i) => i !== index))

  const updateSnsRow = (index: number, patch: Partial<SnsRow>) => {
    setSnsRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    if (computedAge == null || computedAge < 0) {
      setFormError('올바른 생년월일을 선택해 주세요.')
      return
    }
    const normalizedSns: Array<{ platform: string; url: string }> = []
    for (const row of snsRows) {
      const p = row.platform.trim().toLowerCase()
      const u = row.url.trim()
      if (!p && !u) continue
      if (!p || !u) {
        setFormError('SNS는 플랫폼과 URL을 함께 입력하거나, 행을 비워 주세요.')
        return
      }
      normalizedSns.push({ platform: p, url: u })
    }
    setSubmitting(true)
    try {
      await onSubmit({
        auditionId,
        name: values.name.trim(),
        birthDate: values.birthDate,
        age: computedAge,
        nationality: values.nationality,
        videoUrl: values.videoUrl.trim(),
        introText: values.introText.trim(),
        snsLinks: normalizedSns,
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '제출에 실패했습니다.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  })

  const blocked = Boolean(disabled || submitting)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      ) : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">기본 정보</h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">이름</span>
            <input
              {...form.register('name')}
              autoComplete="name"
              disabled={blocked}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
              placeholder="실명을 입력해 주세요"
            />
            {form.formState.errors.name ? (
              <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">생년월일</span>
            <input
              type="date"
              {...form.register('birthDate')}
              disabled={blocked}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
            />
            {form.formState.errors.birthDate ? (
              <span className="text-xs text-red-600">{form.formState.errors.birthDate.message}</span>
            ) : null}
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">나이</span>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-800">
              {computedAge != null && computedAge >= 0 ? `${computedAge}세 (자동 계산)` : '생년월일을 선택하면 표시됩니다'}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">국적</span>
            <select
              {...form.register('nationality')}
              disabled={blocked}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
            >
              {NATIONALITIES.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">영상</h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">영상 URL</span>
          <input
            type="url"
            inputMode="url"
            {...form.register('videoUrl')}
            disabled={blocked}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
            placeholder="유튜브 / 틱톡 / 인스타 영상 링크 입력"
          />
          {form.formState.errors.videoUrl ? (
            <span className="text-xs text-red-600">{form.formState.errors.videoUrl.message}</span>
          ) : null}
        </label>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-neutral-900">SNS (선택)</h2>
          <button
            type="button"
            onClick={addSnsRow}
            disabled={blocked}
            className="shrink-0 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800 disabled:opacity-50"
          >
            + SNS 추가
          </button>
        </div>
        <p className="mb-3 text-xs text-neutral-500">필수 아님 · 입력하지 않아도 지원할 수 있습니다.</p>
        <div className="flex flex-col gap-3">
          {snsRows.length === 0 ? (
            <p className="text-sm text-neutral-400">등록된 SNS 링크가 없습니다.</p>
          ) : null}
          {snsRows.map((row, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 min-[480px]:flex-row min-[480px]:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-neutral-600">플랫폼</span>
                <select
                  value={row.platform}
                  onChange={(e) => updateSnsRow(index, { platform: e.target.value })}
                  disabled={blocked}
                  className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm disabled:bg-neutral-100"
                >
                  {SNS_PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-[2] flex-col gap-1">
                <span className="text-xs font-medium text-neutral-600">URL</span>
                <input
                  type="url"
                  value={row.url}
                  onChange={(e) => updateSnsRow(index, { url: e.target.value })}
                  disabled={blocked}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm disabled:bg-neutral-100"
                  placeholder="https://"
                />
              </label>
              <button
                type="button"
                onClick={() => removeSnsRow(index)}
                disabled={blocked}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-red-600 min-[480px]:mb-0"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">지원 동기 · 자기소개</h2>
        <label className="flex flex-col gap-1">
          <textarea
            {...form.register('introText')}
            disabled={blocked}
            rows={8}
            className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
            placeholder="지원 동기와 자기소개를 50자 이상 입력해 주세요."
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>{form.formState.errors.introText?.message}</span>
            <span>{form.watch('introText')?.length ?? 0} / 최소 50자</span>
          </div>
        </label>
      </section>

      <button
        type="submit"
        disabled={blocked}
        className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-base 
          font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? '제출 중…' : '지원서 제출'}
      </button>
    </form>
  )
}
