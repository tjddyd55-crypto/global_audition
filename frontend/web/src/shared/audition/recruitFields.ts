/**
 * 모집 분야 고정 코드 세트 (backend RecruitFieldCodes 와 동일).
 * 표시 문구는 i18n 카탈로그 `recruitField.<CODE>` 에서 만든다.
 * 알려진 한글/영문/몽골어 레거시 값은 코드로 정규화, 알 수 없는 자유 텍스트는 그대로 표시.
 */
export const RECRUIT_FIELD_CODES = ['VOCAL', 'DANCE', 'RAP', 'PRODUCING', 'ACTING', 'MODEL', 'TEAM'] as const
export type RecruitFieldCode = (typeof RECRUIT_FIELD_CODES)[number]

const ALIASES: Record<string, RecruitFieldCode> = {
  vocal: 'VOCAL', vocals: 'VOCAL', vocalist: 'VOCAL', 보컬: 'VOCAL', 가수: 'VOCAL', дуу: 'VOCAL', дуучин: 'VOCAL',
  dance: 'DANCE', dancer: 'DANCE', 댄스: 'DANCE', 댄서: 'DANCE', бүжиг: 'DANCE', бүжигчин: 'DANCE',
  rap: 'RAP', rapper: 'RAP', 랩: 'RAP', 래퍼: 'RAP', рэп: 'RAP',
  producing: 'PRODUCING', producer: 'PRODUCING', production: 'PRODUCING', 프로듀싱: 'PRODUCING', 프로듀서: 'PRODUCING', продюсер: 'PRODUCING',
  acting: 'ACTING', actor: 'ACTING', actress: 'ACTING', 연기: 'ACTING', 배우: 'ACTING', жүжиглэх: 'ACTING', жүжигчин: 'ACTING',
  model: 'MODEL', modeling: 'MODEL', 모델: 'MODEL', 'загвар өмсөгч': 'MODEL',
  team: 'TEAM', group: 'TEAM', 팀: 'TEAM', баг: 'TEAM',
}

export function toRecruitFieldCode(raw: string): RecruitFieldCode | null {
  const t = (raw ?? '').trim()
  if (!t) return null
  const up = t.toUpperCase()
  if ((RECRUIT_FIELD_CODES as readonly string[]).includes(up)) return up as RecruitFieldCode
  return ALIASES[t.toLowerCase()] ?? null
}

/** `t` 는 `recruitField` 네임스페이스 번역 함수. */
export function recruitFieldLabel(raw: string, t: (key: string) => string): string {
  const code = toRecruitFieldCode(raw)
  return code ? t(code) : (raw ?? '').trim()
}

export function recruitFieldLabels(values: readonly string[] | null | undefined, t: (key: string) => string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values ?? []) {
    const label = recruitFieldLabel(String(v ?? ''), t)
    if (label && !seen.has(label)) {
      seen.add(label)
      out.push(label)
    }
  }
  return out
}
