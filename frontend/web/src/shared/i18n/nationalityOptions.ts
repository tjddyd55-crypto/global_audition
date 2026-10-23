export const NATIONALITY_CODES = ['KR', 'MN', 'JP', 'OTHER'] as const

export type NationalityCode = (typeof NATIONALITY_CODES)[number]

export function nationalityOptionValues(): Array<'' | NationalityCode> {
  return ['', ...NATIONALITY_CODES]
}
