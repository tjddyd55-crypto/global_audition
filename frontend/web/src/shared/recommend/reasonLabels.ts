/** 추천 이유 문구. '지원 가능'은 eligibility=ELIGIBLE 일 때만 쓴다. */
export function recommendationReasonLabel(
  reason: string,
  eligibility: string | null | undefined,
  t: (key: string) => string,
): string | null {
  switch (reason) {
    case 'FIELD_MATCH':
      return t('recommend.fieldMatch')
    case 'COUNTRY_RESIDENCE':
      return eligibility === 'ELIGIBLE' ? t('recommend.countryResidence') : t('recommend.countryResidenceTarget')
    case 'COUNTRY_NATIONALITY':
      return t('recommend.countryNationality')
    case 'CLOSING_SOON':
      return t('recommend.closingSoon')
    case 'SAVED_AFFINITY':
      return t('recommend.savedAffinity')
    default:
      return null
  }
}

export function formatDday(
  remainingDays: number | null | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
): string | null {
  if (remainingDays == null || Number.isNaN(Number(remainingDays))) return null
  const n = Math.trunc(Number(remainingDays))
  if (n <= 0) return t('home.dDayToday')
  return t('home.dDay', { n })
}
