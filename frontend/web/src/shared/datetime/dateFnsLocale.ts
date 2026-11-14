import { enUS, km, ko, mn, uz, type Locale } from 'date-fns/locale'

/** 화면 로케일 → date-fns 로케일. ko/mn/km/uz 외에는 en-US. uz 는 라틴 표기. */
export function dateFnsLocale(locale: string): Locale {
  if (locale.startsWith('ko')) return ko
  if (locale.startsWith('mn')) return mn
  if (locale.startsWith('km')) return km
  if (locale.startsWith('uz')) return uz
  return enUS
}
