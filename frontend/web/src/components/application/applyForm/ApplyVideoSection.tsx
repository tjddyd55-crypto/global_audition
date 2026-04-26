'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { AuditionApplyFormValues } from '../AuditionApplyForm'

type ApplyVideoSectionProps = {
  form: UseFormReturn<AuditionApplyFormValues>
  blocked: boolean
}

export default function ApplyVideoSection({ form, blocked }: ApplyVideoSectionProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-neutral-900">영상</h2>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-700">영상 URL (필수)</span>
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
  )
}
