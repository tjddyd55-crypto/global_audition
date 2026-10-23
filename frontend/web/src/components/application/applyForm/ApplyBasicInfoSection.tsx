'use client'

import { useTranslations } from 'next-intl'
import type { UseFormReturn } from 'react-hook-form'
import type { MeProfileForApply } from '@/shared/api/meProfile'
import { nationalityOptionValues } from '@/shared/i18n/nationalityOptions'
import type { AuditionApplyFormValues } from '../AuditionApplyForm'

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
  const t = useTranslations('apply')
  const tNat = useTranslations('nationality')

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-neutral-900">{t('sectionBasic')}</h2>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">{t('nameOptional')}</span>
          <input
            {...form.register('name')}
            autoComplete="name"
            disabled={blocked}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
            placeholder={t('namePlaceholder')}
          />
          {form.formState.errors.name ? (
            <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">{t('nicknameProfile')}</span>
          <input
            readOnly
            value={meProfile?.nickname?.trim() ?? ''}
            disabled={blocked}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-700 outline-none"
            placeholder={t('nicknamePlaceholder')}
          />
          <span className="whitespace-normal break-words text-xs text-neutral-500">{t('nicknameHint')}</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">{t('birthOptional')}</span>
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
          <span className="text-sm font-medium text-neutral-700">{t('age')}</span>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-800">
            {birthDate?.trim() && computedAge != null && computedAge >= 0
              ? t('ageAuto', { age: computedAge })
              : t('ageHint')}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">{t('nationalityOptional')}</span>
          <select
            {...form.register('nationality')}
            disabled={blocked}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-neutral-100"
          >
            {nationalityOptionValues().map((code) => (
              <option key={code === '' ? '_empty' : code} value={code}>
                {code === '' ? tNat('unspecified') : tNat(code)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
