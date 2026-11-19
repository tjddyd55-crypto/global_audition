'use client'

import { useTranslations } from 'next-intl'
import type { ChannelListSort } from '@/shared/api/channel'
import { AUDIENCE_FILTER_OPTIONS, type AudienceFilterOption } from '@/shared/audition/audienceSelection'
import { CHANNEL_FIELD_FILTERS, CHANNEL_SORTS, isChannelSort, type ChannelFieldFilter } from '@/shared/channel/discovery'

type Props = {
  query: string
  onQuery: (q: string) => void
  country: AudienceFilterOption
  onCountry: (c: AudienceFilterOption) => void
  field: ChannelFieldFilter
  onField: (f: ChannelFieldFilter) => void
  sort: ChannelListSort
  onSort: (s: ChannelListSort) => void
  /** mobile: 칩 줄을 가로 스크롤, PC: 줄바꿈 */
  compact?: boolean
}

export function ChannelDiscoveryFilters({ query, onQuery, country, onCountry, field, onField, sort, onSort, compact }: Props) {
  const t = useTranslations('channel')
  const tCountry = useTranslations('country')
  const tField = useTranslations('recruitField')
  const tAud = useTranslations('auditions')
  const rowClass = compact
    ? 'flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
    : 'flex flex-wrap gap-2'

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="channel-filters">
      <div className="flex min-w-0 gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          data-testid="channel-search"
          className="h-11 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm"
        />
        <label className="sr-only" htmlFor="channel-sort">
          {t('sortLabel')}
        </label>
        <select
          id="channel-sort"
          value={sort}
          onChange={(e) => isChannelSort(e.target.value) && onSort(e.target.value)}
          data-testid="channel-sort"
          className="h-11 max-w-[45%] shrink-0 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
        >
          {CHANNEL_SORTS.map((s) => (
            <option key={s} value={s}>
              {t(`sort.${s}`)}
            </option>
          ))}
        </select>
      </div>
      <div className={rowClass} role="group" aria-label={t('countryFilter')} data-testid="channel-country-chips">
        {AUDIENCE_FILTER_OPTIONS.map((c) => (
          <Chip key={c} active={country === c} onClick={() => onCountry(c)}>
            {c === 'ALL' ? tAud('filterAll') : tCountry(c)}
          </Chip>
        ))}
      </div>
      <div className={rowClass} role="group" aria-label={t('fieldFilter')} data-testid="channel-field-chips">
        {CHANNEL_FIELD_FILTERS.map((f) => (
          <Chip key={f} active={field === f} onClick={() => onField(f)}>
            {f === 'ALL' ? t('allCategories') : f === 'OTHER' ? t('fieldOther') : tField(f)}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-9 shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${
        active ? 'bg-violet-600 text-white' : 'border border-neutral-300 bg-white text-neutral-800'
      }`}
    >
      {children}
    </button>
  )
}
