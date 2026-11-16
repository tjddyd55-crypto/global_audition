'use client'

import {
  MAX_VOTING_ROUNDS,
  clampRoundCount,
  normalizeRounds,
  presetOf,
  roundsForPreset,
  toggleRound,
  type VotingPreset,
} from '@/shared/audition/votingRounds'

/**
 * 기획사 공고 등록·수정: 회차별 투표(랭킹) 사용 설정.
 * 기획사·관리자 화면은 한국어 전용 정책이라 문구를 카탈로그에 두지 않는다.
 */
const COPY = {
  title: '투표·랭킹 설정',
  hint: '회차별로 공개 투표와 랭킹을 쓸지 정합니다. 투표를 끈 회차에는 투표 보기·랭킹 버튼이 보이지 않습니다.',
  roundCount: '총 회차 수',
  presets: { NONE: '투표 없음', FINAL: '마지막 회차만', ALL: '모든 회차' } as Record<Exclude<VotingPreset, 'CUSTOM'>, string>,
  custom: '직접 선택',
  round: (n: number) => `${n}차`,
  summaryNone: '이 공고는 투표·랭킹을 사용하지 않습니다.',
  summaryRounds: (list: string) => `투표·랭킹 사용 회차: ${list}`,
  editNote: '이미 받은 투표는 설정을 꺼도 삭제되지 않으며, 새 투표만 막고 화면에서 숨깁니다.',
}

export type VotingRoundsValue = { count: number; rounds: number[] }

export function AuditionVotingRoundsField({
  value,
  onChange,
  disabled,
  showEditNote,
}: {
  value: VotingRoundsValue
  onChange: (next: VotingRoundsValue) => void
  disabled?: boolean
  showEditNote?: boolean
}) {
  const count = clampRoundCount(value.count)
  const rounds = normalizeRounds(value.rounds, count)
  const preset = presetOf(count, rounds)

  const setCount = (n: number) => {
    const next = clampRoundCount(n)
    // 프리셋을 쓰던 중이면 회차 수가 바뀌어도 같은 의미(예: 마지막 회차만)를 유지한다.
    const nextRounds = preset === 'CUSTOM' ? normalizeRounds(rounds, next) : roundsForPreset(preset, next)
    onChange({ count: next, rounds: nextRounds })
  }

  return (
    <fieldset className="mb-6 rounded-xl border border-gray-200 p-4" data-testid="voting-rounds-field" disabled={disabled}>
      <legend className="px-1 text-sm font-semibold text-gray-900">{COPY.title}</legend>
      <p className="mb-3 text-xs leading-5 text-gray-500">{COPY.hint}</p>

      <label className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-800">
        <span className="font-medium">{COPY.roundCount}</span>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
          data-testid="voting-round-count"
        >
          {Array.from({ length: MAX_VOTING_ROUNDS }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {COPY.round(n)}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={COPY.title}>
        {(['NONE', 'FINAL', 'ALL'] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={preset === p}
            data-testid={`voting-preset-${p}`}
            onClick={() => onChange({ count, rounds: roundsForPreset(p, count) })}
            className={`h-9 rounded-full border px-3 text-sm font-medium ${
              preset === p ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-300 bg-white text-gray-800'
            }`}
          >
            {COPY.presets[p]}
          </button>
        ))}
        {preset === 'CUSTOM' ? (
          <span className="inline-flex h-9 items-center rounded-full border border-violet-200 bg-violet-50 px-3 text-sm text-violet-800">
            {COPY.custom}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const on = rounds.includes(n)
          return (
            <label
              key={n}
              className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
                on ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                data-testid={`voting-round-${n}`}
                onChange={() => onChange({ count, rounds: toggleRound(rounds, n, count) })}
              />
              {COPY.round(n)}
            </label>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-gray-600" data-testid="voting-summary">
        {rounds.length === 0 ? COPY.summaryNone : COPY.summaryRounds(rounds.map(COPY.round).join(', '))}
      </p>
      {showEditNote ? <p className="mt-1 text-xs text-gray-500">{COPY.editNote}</p> : null}
    </fieldset>
  )
}
