/** 공개 득표·랭킹은 투표가 시작된 뒤(진행 중·종료)에만 보여 준다. 시작 전에는 숨긴다. */
export function canShowPublicVoteCount(status?: string | null): boolean {
  return status === 'OPEN' || status === 'CLOSED'
}

export type VoteRemaining =
  | { kind: 'none' }
  | { kind: 'ended' }
  | { kind: 'days'; n: number }
  | { kind: 'hours'; n: number }
  | { kind: 'minutes'; n: number }

/** 남은 시간을 일·시간·분 단위로 나눈다. 통계를 만들지 않고 종료 시각만 본다. */
export function voteRemaining(endAt: string | Date | null | undefined, now: Date = new Date()): VoteRemaining {
  if (endAt == null || endAt === '') return { kind: 'none' }
  const end = typeof endAt === 'string' ? new Date(endAt) : endAt
  if (Number.isNaN(end.getTime())) return { kind: 'none' }
  const ms = end.getTime() - now.getTime()
  if (ms <= 0) return { kind: 'ended' }
  const minutes = Math.max(1, Math.round(ms / 60_000))
  if (minutes < 60) return { kind: 'minutes', n: minutes }
  const hours = Math.round(ms / 3_600_000)
  if (hours < 24) return { kind: 'hours', n: Math.max(1, hours) }
  return { kind: 'days', n: Math.max(1, Math.round(ms / 86_400_000)) }
}

export function remainingMessage(
  remaining: VoteRemaining,
  t: (key: string, values?: { n: number }) => string,
): string | null {
  if (remaining.kind === 'none') return null
  if (remaining.kind === 'ended') return t('remainingEnded')
  if (remaining.kind === 'days') return t('remainingDays', { n: remaining.n })
  if (remaining.kind === 'hours') return t('remainingHours', { n: remaining.n })
  return t('remainingMinutes', { n: remaining.n })
}
