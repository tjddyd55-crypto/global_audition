import { normalizeTargetCountry } from './audience'

/** 서버 listOpen: 빈 값·GLOBAL·ALL 은 공개 OPEN 전체. 국가 코드는 그 국가+GLOBAL. */
export const ALL_OPEN_AUDIENCES = 'ALL' as const
export const AUDIENCE_COUNTRY_STORAGE_KEY = 'audition.audienceCountry'

/**
 * 발견 필터에서 실제로 좁히는 값만 둔다.
 * GLOBAL 은 서버에서 ALL 과 같아 별도 칩으로 두지 않는다.
 */
export const AUDIENCE_FILTER_OPTIONS = ['ALL', 'KR', 'MN', 'JP', 'OTHER'] as const
export type AudienceFilterOption = (typeof AUDIENCE_FILTER_OPTIONS)[number]

const NARROWING = new Set<string>(['KR', 'MN', 'JP', 'OTHER'])

/** 언어와 무관하다. 비어 있거나 GLOBAL 이면 공개 OPEN 전체. */
export function normalizeAudienceCountry(raw?: string | null): AudienceFilterOption {
  if (!raw || !raw.trim()) return ALL_OPEN_AUDIENCES
  const upper = raw.trim().toUpperCase()
  if (upper === ALL_OPEN_AUDIENCES) return ALL_OPEN_AUDIENCES
  const target = normalizeTargetCountry(upper)
  if (NARROWING.has(target)) return target as AudienceFilterOption
  return ALL_OPEN_AUDIENCES
}

export function openAuditionListParams(locale?: string, country?: string) {
  return {
    status: 'OPEN' as const,
    ...(locale ? { locale } : {}),
    country: normalizeAudienceCountry(country),
  }
}
