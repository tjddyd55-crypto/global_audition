/**
 * 모집 회차 배지 문구. 서버의 recruitmentRoundLabel(서버 기본 로케일 문자열) 대신
 * status + round 로 현재 UI 로케일 카탈로그(status.round*)에서 만든다.
 */
type StatusT = (key: 'roundOpen' | 'roundClosed' | 'roundDraft', values: { n: number }) => string

export function roundStatusLabel(
  status: string | null | undefined,
  round: number | null | undefined,
  t: StatusT,
): string {
  const n = Number.isFinite(Number(round)) && Number(round) > 0 ? Number(round) : 1
  if (status === 'OPEN') return t('roundOpen', { n })
  if (status === 'CLOSED') return t('roundClosed', { n })
  return t('roundDraft', { n })
}
