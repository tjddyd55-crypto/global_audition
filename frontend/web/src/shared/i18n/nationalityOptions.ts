/** 지원자 국적. 국가 코드(KH, UZ)는 언어 코드(km, uz)와 다른 값이다. */
export const NATIONALITY_CODES = ['KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER'] as const

export type NationalityCode = (typeof NATIONALITY_CODES)[number]

export function isNationalityCode(value: string): value is NationalityCode {
  return (NATIONALITY_CODES as readonly string[]).includes(value)
}

/** 대문자로 맞춘 뒤 알려진 국적만 돌려준다. 모르는 값은 빈 문자열. */
export function normalizeNationalityCode(raw: string | null | undefined): '' | NationalityCode {
  const n = (raw ?? '').trim().toUpperCase()
  return isNationalityCode(n) ? n : ''
}

export function nationalityOptionValues(): Array<'' | NationalityCode> {
  return ['', ...NATIONALITY_CODES]
}
