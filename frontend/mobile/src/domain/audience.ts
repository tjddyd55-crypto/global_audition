/** UI 로케일 → 발견 필터 country. MN은 MN+GLOBAL, KR은 KR+GLOBAL. */
export function audienceCountryFromLocale(locale?: string | null): string {
  const language = (locale ?? '').trim().toLowerCase().replace('_', '-').split('-')[0]
  if (language === 'mn') return 'MN'
  if (language === 'ko') return 'KR'
  if (language === 'ja') return 'JP'
  return 'GLOBAL'
}
