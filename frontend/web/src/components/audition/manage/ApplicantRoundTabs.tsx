'use client'

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
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onChange('all')}
          className={
            value === 'all'
              ? 'shrink-0 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm'
              : 'shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50'
          }
        >
          전체({applicantTotalCount})
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
                  ? 'shrink-0 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm'
                  : 'shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50'
              }
            >
              {n}차({c})
            </button>
          )
        })}
      </div>
      <p className="text-sm font-medium text-gray-800">
        {value === 'all' ? '현재: 전체 지원자' : `현재: ${value}차 지원자`}
      </p>
    </div>
  )
}
