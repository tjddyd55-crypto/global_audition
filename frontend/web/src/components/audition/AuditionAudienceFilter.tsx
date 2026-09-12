'use client'

import { useTranslations } from 'next-intl'
import { audienceCountryFromLocale } from '@/shared/audition/audience'

type AudienceScope = 'region' | 'all'

type Props = {
  locale: string
  scope: AudienceScope
  onChange: (scope: AudienceScope) => void
}

export function AuditionAudienceFilter({ locale, scope, onChange }: Props) {
  const t = useTranslations('auditions')
  const tCountry = useTranslations('country')
  const region = audienceCountryFromLocale(locale)

  return (
    <div className="mb-4 min-w-0">
      <div className="flex flex-wrap gap-2">
        <FilterChip active={scope === 'region'} onClick={() => onChange('region')}>
          {t('filterRegion')} · {tCountry(region as 'MN')}
        </FilterChip>
        <FilterChip active={scope === 'all'} onClick={() => onChange('all')}>
          {t('filterAll')}
        </FilterChip>
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
