type RelativeTranslator = (
  key: 'justNow' | 'minutesAgo' | 'hoursAgo' | 'daysAgo' | 'monthsAgo',
  values?: { n: number },
) => string

export function formatRelative(iso: string, t: RelativeTranslator): string {
  if (!iso) return ''
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return ''
  const diff = Date.now() - parsed
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return t('justNow')
  const min = Math.floor(sec / 60)
  if (min < 60) return t('minutesAgo', { n: min })
  const hr = Math.floor(min / 60)
  if (hr < 24) return t('hoursAgo', { n: hr })
  const day = Math.floor(hr / 24)
  if (day < 30) return t('daysAgo', { n: day })
  const mon = Math.floor(day / 30)
  return t('monthsAgo', { n: mon })
}
