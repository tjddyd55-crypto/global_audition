'use client'

import { useTranslations } from 'next-intl'
import { recommendationReasonLabel } from '@/shared/recommend/reasonLabels'

export function RecommendationReasons({
  reasons,
  eligibility,
}: {
  reasons?: string[]
  eligibility?: string | null
}) {
  const t = useTranslations()
  const labels = (reasons ?? [])
    .map((reason) => recommendationReasonLabel(reason, eligibility, (key) => t(key)))
    .filter((value): value is string => Boolean(value))
  if (labels.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span key={label} className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
          {label}
        </span>
      ))}
    </div>
  )
}

export function AuditionMetaLine({
  agency,
  fields,
  country,
  dday,
}: {
  agency?: string | null
  fields?: string
  country?: string
  dday?: string | null
}) {
  const line = [fields, country, dday].filter(Boolean).join(' · ')
  return (
    <>
      {agency ? <p className="truncate text-xs text-neutral-500">{agency}</p> : null}
      {line ? <p className="truncate text-xs text-neutral-500">{line}</p> : null}
    </>
  )
}
