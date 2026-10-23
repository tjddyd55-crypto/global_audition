'use client'

import { useTranslations } from 'next-intl'
import { AUDIENCE_FILTER_OPTIONS, type AudienceFilterOption } from '@/shared/audition/audienceSelection'

type Props = {
  country: AudienceFilterOption
  onChange: (country: AudienceFilterOption) => void
}

export function AuditionAudienceFilter({ country, onChange }: Props) {
  const t = useTranslations('auditions')
  const tCountry = useTranslations('country')

  return (
    <div className="mb-4 min-w-0">
      <div className="flex flex-wrap gap-2">
        {AUDIENCE_FILTER_OPTIONS.map((option) => (
          <FilterChip key={option} active={country === option} onClick={() => onChange(option)}>
            {option === 'ALL' ? t('filterAll') : tCountry(option)}
          </FilterChip>
        ))}
      </div>
      <p className="mt-2 max-w-xl whitespace-normal break-words text-sm text-neutral-500">{t('filterHint')}</p>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 min-w-0 whitespace-normal break-words rounded-full px-3 py-2 text-sm font-semibold leading-tight ${
        active ? 'bg-violet-600 text-white' : 'border border-neutral-300 bg-white text-neutral-800'
      }`}
    >
      {children}
    </button>
  )
}
