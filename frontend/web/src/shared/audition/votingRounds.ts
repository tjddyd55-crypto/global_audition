/**
 * 공고별 회차 투표(랭킹) 설정 — 웹·네이티브 공용 순수 로직.
 * 서버 규칙(VotingRoundPlan): votingRounds 가 null 이면 기존 동작(모든 회차 투표),
 * 빈 배열이면 투표 없음, [3] 이면 3차만. 랭킹은 투표를 따른다.
 */
export const MAX_VOTING_ROUNDS = 10

export type VotingPreset = 'NONE' | 'FINAL' | 'ALL' | 'CUSTOM'

export type VoteStatus = 'NOT_STARTED' | 'SCHEDULED' | 'OPEN' | 'CLOSED'

export type AuditionVotingFields = {
  votingRoundCount: number | null
  votingRounds: number[] | null
  /** 지금 표를 받을 수 있는지(서버 계산). 값이 없으면 기존 동작 = true */
  votingEnabled: boolean
  votingRoundNumber: number
  voteStatus?: VoteStatus
  voteStartAt?: string | null
  voteEndAt?: string | null
  voteRoundNumber?: number | null
}

const VOTE_STATUSES: VoteStatus[] = ['NOT_STARTED', 'SCHEDULED', 'OPEN', 'CLOSED']

export function parseVoteStatus(raw: unknown): VoteStatus | undefined {
  const v = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
  return (VOTE_STATUSES as string[]).includes(v) ? (v as VoteStatus) : undefined
}

export function parseAuditionVotingFields(raw: Record<string, unknown>): AuditionVotingFields {
  const count = Number(raw.votingRoundCount)
  const rounds = Array.isArray(raw.votingRounds)
    ? (raw.votingRounds as unknown[]).map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1)
    : null
  const roundNumber = Number(raw.votingRoundNumber)
  const voteRound = Number(raw.voteRoundNumber)
  const iso = (v: unknown): string | null => {
    if (v == null || String(v).trim() === '') return null
    return String(v)
  }
  return {
    votingRoundCount: Number.isInteger(count) && count >= 1 ? count : null,
    votingRounds: rounds,
    votingEnabled: raw.votingEnabled === false ? false : true,
    votingRoundNumber: Number.isInteger(roundNumber) && roundNumber >= 1 ? roundNumber : 1,
    voteStatus: parseVoteStatus(raw.voteStatus),
    voteStartAt: iso(raw.voteStartAt),
    voteEndAt: iso(raw.voteEndAt),
    voteRoundNumber: Number.isInteger(voteRound) && voteRound >= 1 ? voteRound : null,
  }
}

export function clampRoundCount(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(MAX_VOTING_ROUNDS, Math.max(1, Math.trunc(n)))
}

export function roundsForPreset(preset: Exclude<VotingPreset, 'CUSTOM'>, count: number): number[] {
  const c = clampRoundCount(count)
  if (preset === 'NONE') return []
  if (preset === 'FINAL') return [c]
  return Array.from({ length: c }, (_, i) => i + 1)
}

export function presetOf(count: number, rounds: number[]): VotingPreset {
  const c = clampRoundCount(count)
  const set = normalizeRounds(rounds, c)
  if (set.length === 0) return 'NONE'
  if (set.length === c) return 'ALL'
  if (set.length === 1 && set[0] === c) return 'FINAL'
  return 'CUSTOM'
}

/** 1..count 범위만 남기고 정렬·중복 제거 */
export function normalizeRounds(rounds: number[], count: number): number[] {
  const c = clampRoundCount(count)
  return [...new Set(rounds.filter((n) => Number.isInteger(n) && n >= 1 && n <= c))].sort((a, b) => a - b)
}

export function toggleRound(rounds: number[], round: number, count: number): number[] {
  const has = rounds.includes(round)
  return normalizeRounds(has ? rounds.filter((n) => n !== round) : [...rounds, round], count)
}

/** 편집 폼 초기값: 기존 공고에 설정이 없으면(null) 기존 동작과 같은 '모든 회차'로 보여 준다. */
export function initialVotingForm(a?: { votingRoundCount?: number | null; votingRounds?: number[] | null }): {
  count: number
  rounds: number[]
} {
  const count = clampRoundCount(a?.votingRoundCount ?? Math.max(1, ...(a?.votingRounds ?? [1])))
  const rounds = a?.votingRounds == null ? roundsForPreset('ALL', count) : normalizeRounds(a.votingRounds, count)
  return { count, rounds }
}
