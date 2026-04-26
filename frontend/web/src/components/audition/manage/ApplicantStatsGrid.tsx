'use client'

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
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <ApplicantStatCard label="전체" value={stats.total} tone="violet" />
      <ApplicantStatCard label="대기(미심사)" value={stats.submitted} tone="neutral" />
      <ApplicantStatCard label="검토중" value={stats.reviewing} tone="blue" />
      <ApplicantStatCard label="합격" value={stats.accepted} tone="green" />
      <ApplicantStatCard label="불합격" value={stats.rejected} tone="red" />
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
      <div className={TEXT_SUB}>{label}</div>
    </div>
  )
}
