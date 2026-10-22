import { enUS, ko, mn, type Locale } from 'date-fns/locale'

/** 화면 로케일 → date-fns 로케일. ko/mn 외에는 en-US. */
export function dateFnsLocale(locale: string): Locale {
  if (locale.startsWith('ko')) return ko
  if (locale.startsWith('mn')) return mn
  return enUS
}
