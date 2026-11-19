/** 백엔드 ChannelPortfolioRules.FIELD_FILTERS 와 같은 순서. OTHER = 이름 있는 분야 외 전부. */
export const CHANNEL_FIELD_FILTERS = ['ALL', 'VOCAL', 'DANCE', 'RAP', 'ACTING', 'MODEL', 'INFLUENCER', 'OTHER'] as const
export type ChannelFieldFilter = (typeof CHANNEL_FIELD_FILTERS)[number]

/** 실제 데이터로만 계산되는 정렬(가짜 지표 없음). */
export const CHANNEL_SORTS = ['NEWEST', 'RECENT_ACTIVITY', 'POPULAR', 'VIEWS', 'FOLLOWERS'] as const
export type ChannelListSort = (typeof CHANNEL_SORTS)[number]

export const CHANNEL_PAGE_SIZE = 24

/** 백엔드 ChannelCareerStore 카테고리와 같은 순서. */
export const CAREER_CATEGORIES = ['PERFORMANCE', 'TRAINING', 'DANCE_VOCAL', 'ACTING_MODEL', 'CONTEST_AWARD', 'OTHER'] as const

/** 백엔드 ChannelPortfolioRules.LANGUAGE_CODES (messages `languages` 키 재사용). */
export const CHANNEL_LANGUAGE_CODES = ['ko', 'en', 'mn', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'th', 'vi', 'km', 'uz'] as const
export const MAX_CHANNEL_LANGUAGES = 8

export const AGE_BANDS = ['U18', '18_19', '20_24', '25_29', '30_34', '35_39', '40_PLUS'] as const

export function isChannelSort(raw: string | null | undefined): raw is ChannelListSort {
  return !!raw && (CHANNEL_SORTS as readonly string[]).includes(raw)
}

export function isFieldFilter(raw: string | null | undefined): raw is ChannelFieldFilter {
  return !!raw && (CHANNEL_FIELD_FILTERS as readonly string[]).includes(raw)
}

/** "2021" / "2021-03" → 표시 문자열. end 없으면 present 라벨. */
export function formatCareerPeriod(start?: string | null, end?: string | null, present = ''): string {
  const s = (start ?? '').trim()
  const e = (end ?? '').trim()
  if (!s && !e) return ''
  if (s && !e) return `${s.replace('-', '.')} – ${present}`.trim()
  if (!s) return e.replace('-', '.')
  return s === e ? s.replace('-', '.') : `${s.replace('-', '.')} – ${e.replace('-', '.')}`
}
