/**
 * 지원자 가입 국가. UI 언어(ko/en/mn/km/uz)와 따로 고른다.
 * 국가 코드(KH 캄보디아, UZ 우즈베키스탄)와 언어 코드(km, uz)는 서로 다른 값이다.
 * KH/UZ 는 백엔드 countries 테이블에 행이 생기기 전까지 가입 국가로 고를 수 없다
 * (COUNTRY_NOT_FOUND). 국가 개설은 운영 정책 결정 후 별도로 한다.
 */
export const COUNTRY_CODES = [
  'KR',
  'MN',
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
  'mn',
  'km',
  'uz',
] as const

export type LanguageCode = (typeof LANGUAGE_CODES)[number]

export const languages: ReadonlyArray<{ code: LanguageCode }> = LANGUAGE_CODES.map((code) => ({
  code,
}))

export const timezones = [
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST)' },
  { value: 'Asia/Ulaanbaatar', label: 'Asia/Ulaanbaatar (ULAT)' },
  { value: 'Asia/Phnom_Penh', label: 'Asia/Phnom_Penh (ICT)' },
  { value: 'Asia/Tashkent', label: 'Asia/Tashkent (UZT)' },
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
