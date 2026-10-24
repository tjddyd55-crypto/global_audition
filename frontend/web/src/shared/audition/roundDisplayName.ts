/**
 * 다단계 라운드 표시 이름. 회차 번호는 데이터, 문구는 i18n.
 * 서버 기본 생성 이름(빈 값, "N차", "Round N", "N-р шат")은 로케일 문구로 바꾸고,
 * 사용자가 직접 지은 이름은 보존해 "회차 + 이름" 으로 보여준다.
 */
const DEFAULT_NAME = /^\s*(?:(\d+)\s*차|round\s*(\d+)|(\d+)\s*-\s*р\s*шат)\s*$/i

export function isDefaultRoundName(name: string | null | undefined, roundNumber: number): boolean {
  const t = (name ?? '').trim()
  if (!t) return true
  const m = DEFAULT_NAME.exec(t)
  if (!m) return false
  const n = Number(m[1] ?? m[2] ?? m[3])
  return n === roundNumber
}

type T = (key: string, values?: Record<string, string | number>) => string

/** `t` 는 `roundReview` 네임스페이스. */
export function roundDisplayName(roundNumber: number, name: string | null | undefined, t: T): string {
  if (isDefaultRoundName(name, roundNumber)) return t('roundLabel', { n: roundNumber })
  return t('roundName', { n: roundNumber, name: (name ?? '').trim() })
}
