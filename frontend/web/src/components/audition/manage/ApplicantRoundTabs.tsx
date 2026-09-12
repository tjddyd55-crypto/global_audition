'use client'

import { useTranslations } from 'next-intl'

export type RoundTabValue = 'all' | number

type ApplicantRoundTabsProps = {
  value: RoundTabValue
  maxRound: number
  applicantTotalCount: number
  getRoundCount: (round: number) => number
  onChange: (next: RoundTabValue) => void
}

export default function ApplicantRoundTabs({
  value,
  maxRound,
  applicantTotalCount,
  getRoundCount,
  onChange,
}: ApplicantRoundTabsProps) {
  const t = useTranslations('agency')
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onChange('all')}
          className={
            value === 'all'
              ? 'min-h-11 shrink-0 whitespace-normal break-words rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm'
              : 'min-h-11 shrink-0 whitespace-normal break-words rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50'
          }
        >
          {t('allWithCount', { n: applicantTotalCount })}
        </button>
        {Array.from({ length: maxRound }, (_, i) => i + 1).map((n) => {
          const c = getRoundCount(n)
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={
                active
                  ? 'min-h-11 shrink-0 whitespace-normal break-words rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm'
                  : 'min-h-11 shrink-0 whitespace-normal break-words rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50'
              }
            >
              {t('roundWithCount', { n, count: c })}
            </button>
          )
        })}
      </div>
      <p className="whitespace-normal break-words text-sm font-medium text-gray-800">
        {value === 'all' ? t('currentAllApplicants') : t('currentRoundApplicants', { n: value })}
      </p>
    </div>
  )
}
