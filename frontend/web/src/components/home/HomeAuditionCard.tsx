'use client'

import { useTranslations } from 'next-intl'
import AuditionCard from '@/components/cards/AuditionCard'
import type { AuditionDto } from '@/shared/types/audition'
import { recruitFieldLabels } from '@/shared/audition/recruitFields'
import { formatDday } from '@/shared/recommend/reasonLabels'
import { AuditionMetaLine, RecommendationReasons } from '@/shared/home/RecommendationReasons'

export function HomeAuditionCard({
  audition,
  reasons,
  eligibility,
}: {
  audition: AuditionDto
  reasons?: string[]
  eligibility?: string | null
}) {
  const tHome = useTranslations('home')
  const tCountry = useTranslations('country')
  const tField = useTranslations('recruitField')
  const fields = recruitFieldLabels(audition.recruitFields, tField).join(' · ')
  const code = audition.countryCode?.trim()
  const country = code ? (['KR', 'MN', 'GLOBAL', 'JP', 'KH', 'UZ', 'OTHER'].includes(code) ? tCountry(code as 'KR') : code) : ''
  const dday = formatDday(audition.remainingDays, (key, values) => tHome(key.replace(/^home\./, ''), values))
  return (
    <div data-testid="home-audition-card" className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <AuditionCard audition={audition} />
      <div className="space-y-1 px-3 py-2">
        <AuditionMetaLine agency={audition.agencyName} fields={fields} country={country} dday={dday} />
        <RecommendationReasons reasons={reasons} eligibility={eligibility} />
      </div>
    </div>
  )
}
