/** 기존 auditions.country_code 재사용. 새 컬럼을 만들지 않는다. */
export const AUDITION_TARGET_COUNTRIES = ['KR', 'MN', 'GLOBAL', 'JP', 'OTHER'] as const
export type AuditionTargetCountry = (typeof AUDITION_TARGET_COUNTRIES)[number]

export const CONTENT_LOCALES = ['ko', 'en', 'mn'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]

export function isContentLocale(value: string): value is ContentLocale {
  return (CONTENT_LOCALES as readonly string[]).includes(value)
}

export function normalizeTargetCountry(raw?: string | null): AuditionTargetCountry | '' {
  if (!raw) return ''
  const code = raw.trim().toUpperCase()
  if ((AUDITION_TARGET_COUNTRIES as readonly string[]).includes(code)) {
    return code as AuditionTargetCountry
  }
  if (code === 'KOR' || code === 'KOREA') return 'KR'
  if (code === 'MNG' || code === 'MONGOLIA') return 'MN'
  if (code === 'WORLD' || code === 'ALL' || code === 'WW') return 'GLOBAL'
  return ''
}
