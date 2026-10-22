/** 기존 auditions.country_code 재사용. 새 컬럼을 만들지 않는다. */
export const AUDITION_TARGET_COUNTRIES = ['KR', 'MN', 'GLOBAL', 'JP', 'OTHER'] as const

/**
 * 로케일을 국가 코드로 가리키는 힌트.
 * 목록·홈의 기본 범위는 쓰지 않는다. 기본은 normalizeAudienceCountry 의 ALL 이다.
 */
export function audienceCountryFromLocale(locale?: string | null): string {
  const language = (locale ?? '').trim().toLowerCase().replace('_', '-').split('-')[0]
  if (language === 'mn') return 'MN'
  if (language === 'ko') return 'KR'
  if (language === 'ja') return 'JP'
  return 'GLOBAL'
}
export type AuditionTargetCountry = (typeof AUDITION_TARGET_COUNTRIES)[number]

export const CONTENT_LOCALES = ['ko', 'en', 'mn'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]

/** 콘텐츠 번역 대상 8개. UI 카탈로그(ko/en/mn)와 따로 관리한다. */
export const CONTENT_AUTHORING_LOCALES = ['ko', 'en', 'mn', 'ja', 'zh', 'es', 'fr', 'de'] as const
export type AuthoringLocale = (typeof CONTENT_AUTHORING_LOCALES)[number]

const AUTHORING_TAG = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/

export function isContentLocale(value: string): value is ContentLocale {
  return (CONTENT_LOCALES as readonly string[]).includes(value)
}

/** 작성 언어. 8개 밖이어도 태그를 유지하고, 형식이 아니면 ko. */
export function authoringLocaleOrFallback(raw?: string | null): string {
  const tag = (raw ?? '').trim().toLowerCase().replaceAll('_', '-')
  if (tag.length > 0 && tag.length <= 16 && AUTHORING_TAG.test(tag)) return tag
  return 'ko'
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
