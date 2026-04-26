'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { MeProfileForApply } from '@/shared/api/meProfile'
import type { AuditionApplyFormValues } from '../AuditionApplyForm'

const NATIONALITIES = [
  { value: '', label: '선택 안 함' },
  { value: 'KR', label: '대한민국' },
  { value: 'MN', label: '몽골' },
  { value: 'JP', label: '일본' },
  { value: 'OTHER', label: '기타' },
] as const

type ApplyBasicInfoSectionProps = {
  form: UseFormReturn<AuditionApplyFormValues>
  blocked: boolean
  meProfile?: MeProfileForApply | null
  birthDate?: string
  computedAge: number | null
}

export default function ApplyBasicInfoSection({
  form,
  blocked,
  meProfile,
  birthDate,
  computedAge,
}: ApplyBasicInfoSectionProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-neutral-900">기본 정보</h2>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">이름 (선택)</span>
          <input
            {...form.register('name')}
            autoComplete="name"
            disabled={blocked}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
            placeholder="프로필에 없으면 비워도 됩니다"
          />
          {form.formState.errors.name ? (
            <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">닉네임 (프로필)</span>
          <input
            readOnly
            value={meProfile?.nickname?.trim() ?? ''}
            disabled={blocked}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-700 outline-none"
            placeholder="프로필에서 설정한 닉네임이 표시됩니다"
          />
          <span className="text-xs text-neutral-500">지원서 스냅샷의 표시 이름은 위「이름」칸을 사용합니다. 닉네임은 계정 공개 이름입니다.</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">생년월일 (선택)</span>
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
            {birthDate?.trim() && computedAge != null && computedAge >= 0
              ? `${computedAge}세 (자동 계산)`
              : '생년월일을 입력하면 생년월일 기준 나이가 표시됩니다'}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">국적 (선택)</span>
          <select
            {...form.register('nationality')}
            disabled={blocked}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
          >
            {NATIONALITIES.map((n) => (
              <option key={n.value === '' ? '_empty' : n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
