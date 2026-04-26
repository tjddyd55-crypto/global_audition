'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { AuditionApplyFormValues } from '../AuditionApplyForm'

type ApplyIntroSectionProps = {
  form: UseFormReturn<AuditionApplyFormValues>
  blocked: boolean
}

export default function ApplyIntroSection({ form, blocked }: ApplyIntroSectionProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-neutral-900">지원 동기 · 자기소개 (선택)</h2>
      <label className="flex flex-col gap-1">
        <textarea
          {...form.register('introText')}
          disabled={blocked}
          rows={8}
          className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
          placeholder="프로필 자기소개가 있으면 자동으로 채워집니다. 비워도 지원할 수 있습니다."
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{form.formState.errors.introText?.message}</span>
          <span>{form.watch('introText')?.length ?? 0} / 10000</span>
        </div>
      </label>
    </section>
  )
}
