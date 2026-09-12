'use client'

import { useTranslations } from 'next-intl'
import { PAGE_CONTAINER } from '@/shared/ui/specClasses'

type MyApplicantsAuditionSelectorItem = {
  id: string
  title: string
  status: string
}

type MyApplicantsAuditionSelectorProps = {
  auditions: MyApplicantsAuditionSelectorItem[]
  value: string
  onChange: (auditionId: string) => void
}

export default function MyApplicantsAuditionSelector({
  auditions,
  value,
  onChange,
}: MyApplicantsAuditionSelectorProps) {
  const t = useTranslations('common')

  return (
    <div className={`${PAGE_CONTAINER} border-b border-gray-200 bg-white py-4`}>
      <label className="block text-xs font-semibold text-gray-500" htmlFor="agency-audition-filter">
        {t('auditions')}
      </label>
      <select
        id="agency-audition-filter"
        className="mt-1 w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm md:w-auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {auditions.map((a) => (
          <option key={a.id} value={a.id}>
            {a.title} ({a.status})
          </option>
        ))}
      </select>
    </div>
  )
}
