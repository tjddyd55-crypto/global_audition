export const COUNTRY_CODES = [
  'KR',
  'US',
  'JP',
  'CN',
  'GB',
  'FR',
  'DE',
  'IT',
  'ES',
  'CA',
  'AU',
  'BR',
  'MX',
  'IN',
  'RU',
  'TH',
  'VN',
  'PH',
  'ID',
  'SG',
  'MY',
  'TW',
  'HK',
] as const

export type CountryCode = (typeof COUNTRY_CODES)[number]

export const countries: ReadonlyArray<{ code: CountryCode }> = COUNTRY_CODES.map((code) => ({
  code,
}))

export const LANGUAGE_CODES = [
  'ko',
  'en',
  'ja',
  'zh',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ru',
  'th',
  'vi',
] as const

export type LanguageCode = (typeof LANGUAGE_CODES)[number]

export const languages: ReadonlyArray<{ code: LanguageCode }> = LANGUAGE_CODES.map((code) => ({
  code,
}))

export const timezones = [
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' },
]
