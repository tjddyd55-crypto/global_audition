'use client'

import { useTranslations } from 'next-intl'
import type { UseFormReturn } from 'react-hook-form'
import type { AuditionApplyFormValues } from '../AuditionApplyForm'

type ApplyIntroSectionProps = {
  form: UseFormReturn<AuditionApplyFormValues>
  blocked: boolean
}

export default function ApplyIntroSection({ form, blocked }: ApplyIntroSectionProps) {
  const t = useTranslations('apply')
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 whitespace-normal break-words text-lg font-bold text-neutral-900">{t('sectionIntro')}</h2>
      <label className="flex flex-col gap-1">
        <textarea
          {...form.register('introText')}
          disabled={blocked}
          rows={8}
          className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
          placeholder={t('introPlaceholder')}
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{form.formState.errors.introText?.message}</span>
          <span>{form.watch('introText')?.length ?? 0} / 10000</span>
        </div>
      </label>
    </section>
  )
}
