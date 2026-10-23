'use client'

import { useTranslations } from 'next-intl'
import { CARD_BASE, TEXT_SUB } from '@/shared/ui/specClasses'

type ApplicantStatsGridProps = {
  stats: {
    total: number
    submitted: number
    reviewing: number
    accepted: number
    rejected: number
  }
}

export default function ApplicantStatsGrid({ stats }: ApplicantStatsGridProps) {
  const tAgency = useTranslations('agency')
  const tStatus = useTranslations('status')
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <ApplicantStatCard label={tAgency('all')} value={stats.total} tone="violet" />
      <ApplicantStatCard label={tAgency('waitingUnreviewed')} value={stats.submitted} tone="neutral" />
      <ApplicantStatCard label={tStatus('underReview')} value={stats.reviewing} tone="blue" />
      <ApplicantStatCard label={tStatus('accepted')} value={stats.accepted} tone="green" />
      <ApplicantStatCard label={tStatus('rejected')} value={stats.rejected} tone="red" />
    </div>
  )
}

function ApplicantStatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'violet' | 'neutral' | 'blue' | 'green' | 'red'
}) {
  const color =
    tone === 'violet'
      ? 'text-violet-600'
      : tone === 'blue'
        ? 'text-blue-600'
        : tone === 'green'
          ? 'text-green-600'
          : tone === 'red'
            ? 'text-red-600'
            : 'text-gray-900'
  return (
    <div className={`${CARD_BASE} text-center`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className={`${TEXT_SUB} whitespace-normal break-words`}>{label}</div>
    </div>
  )
}
