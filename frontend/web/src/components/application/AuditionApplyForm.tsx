'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { calculateAge } from '@/shared/audition/calculateAge'
import type { MeProfileForApply } from '@/shared/api/meProfile'
import ApplyFormAlerts from './applyForm/ApplyFormAlerts'
import ApplyBasicInfoSection from './applyForm/ApplyBasicInfoSection'
import ApplyVideoSection from './applyForm/ApplyVideoSection'
import ApplySnsSection from './applyForm/ApplySnsSection'
import ApplyIntroSection from './applyForm/ApplyIntroSection'
import ApplySubmitButton from './applyForm/ApplySubmitButton'

const formSchema = z
  .object({
    name: z.string().max(120),
    birthDate: z.string(),
    nationality: z.enum(['', 'KR', 'MN', 'JP', 'OTHER']),
    videoUrl: z.string().min(1, '영상 링크를 입력해 주세요.'),
    introText: z.string().max(10000),
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

export type AuditionApplyFormValues = z.infer<typeof formSchema>

export type SnsRow = { platform: string; url: string }

export type AuditionApplySubmitPayload = {
  auditionId: string
  name?: string | null
  birthDate?: string | null
  age?: number | null
  nationality?: string | null
  videoUrl: string
  introText?: string | null
  snsLinks: Array<{ platform: string; url: string }>
}

type Props = {
  auditionId: string
  disabled?: boolean
  /** GET /me 성공 시 지원서 폼에 복사 (프로필 ID 참조 없음) */
  meProfile?: MeProfileForApply | null
  /** true이면 /me 요청이 끝난 뒤(성공·실패) 한 번만 초기화 */
  meProfileReady?: boolean
  onSubmit: (payload: AuditionApplySubmitPayload) => Promise<void>
}

export function AuditionApplyForm({ auditionId, disabled, meProfile, meProfileReady, onSubmit }: Props) {
  const [snsRows, setSnsRows] = useState<SnsRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [profileAutofillNotice, setProfileAutofillNotice] = useState(false)
  const profileAppliedRef = useRef(false)

  const form = useForm<AuditionApplyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      birthDate: '',
      nationality: '',
      videoUrl: '',
      introText: '',
    },
  })

  useEffect(() => {
    if (!meProfileReady || profileAppliedRef.current) return
    profileAppliedRef.current = true

    if (!meProfile) {
      return
    }

    const name = meProfile.name?.trim() ?? ''
    const nickname = meProfile.nickname?.trim() ?? ''
    const birthDate = meProfile.birthDate?.trim() ?? ''
    const rawNat = meProfile.nationality?.trim().toUpperCase() ?? ''
    const nationality =
      rawNat === 'KR' || rawNat === 'MN' || rawNat === 'JP' || rawNat === 'OTHER' ? rawNat : ''
    const introText = meProfile.introText?.trim() ?? ''
    const links = (meProfile.snsLinks ?? [])
      .filter((l) => l && l.platform?.trim() && l.url?.trim())
      .map((l) => ({
        platform: l.platform.trim().toLowerCase(),
        url: l.url.trim(),
      }))

    form.reset({
      name,
      birthDate,
      nationality,
      videoUrl: '',
      introText,
    })
    setSnsRows(links.length > 0 ? links : [])
    setProfileAutofillNotice(
      Boolean(name || nickname || birthDate || nationality || introText || links.length > 0),
    )
  }, [meProfile, meProfileReady, form])

  const birthDate = useWatch({ control: form.control, name: 'birthDate' })
  const computedAge = useMemo(() => (birthDate ? calculateAge(birthDate) : null), [birthDate])

  const addSnsRow = () => setSnsRows((rows) => [...rows, { platform: 'instagram', url: '' }])

  const removeSnsRow = (index: number) => setSnsRows((rows) => rows.filter((_, i) => i !== index))

  const updateSnsRow = (index: number, patch: Partial<SnsRow>) => {
    setSnsRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    const birth = values.birthDate.trim()
    if (birth && (computedAge == null || computedAge < 0)) {
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
        name: values.name.trim() || null,
        birthDate: birth || null,
        age: birth ? computedAge : null,
        nationality: values.nationality ? values.nationality : null,
        videoUrl: values.videoUrl.trim(),
        introText: values.introText.trim() || null,
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
      <ApplyFormAlerts profileAutofillNotice={profileAutofillNotice} formError={formError} />

      <ApplyBasicInfoSection
        form={form}
        blocked={blocked}
        meProfile={meProfile}
        birthDate={birthDate}
        computedAge={computedAge}
      />

      <ApplyVideoSection form={form} blocked={blocked} />

      <ApplySnsSection
        snsRows={snsRows}
        blocked={blocked}
        onAdd={addSnsRow}
        onRemove={removeSnsRow}
        onUpdate={updateSnsRow}
      />

      <ApplyIntroSection form={form} blocked={blocked} />

      <ApplySubmitButton blocked={blocked} submitting={submitting} />
    </form>
  )
}
