import localesMeta from '../../../web/messages/locales.json'

export const SUPPORTED_LOCALES = localesMeta.supported as readonly string[]
export const PRIMARY_LOCALES = localesMeta.primary as readonly string[]
export const DEFAULT_LOCALE = localesMeta.defaultLocale
export const DEVICE_FALLBACK = localesMeta.deviceFallback
/** 1차 공개 선택. primary 카탈로그는 유지하고 메뉴만 좁힌다. */
export const PUBLIC_SELECTOR = (localesMeta.publicSelector?.length ? localesMeta.publicSelector : [DEFAULT_LOCALE]) as readonly string[]

let currentLocale = DEFAULT_LOCALE

export function setRuntimeLocale(locale: string) {
  currentLocale = normalizeLocale(locale)
}

export function getRuntimeLocale(): string {
  return currentLocale
}

/** 네이티브 UI는 1급 로케일만 유지한다. ja 등 부분 카탈로그는 en으로 내린다. */
export function normalizeLocale(raw?: string | null): string {
  if (!raw) return DEVICE_FALLBACK
  const language = raw.trim().toLowerCase().replace('_', '-').split('-')[0]
  if (PRIMARY_LOCALES.includes(language)) return language
  return DEVICE_FALLBACK
}

/**
 * 저장된 선택이 없으면 영어.
 * 기기 언어는 저장값이 아니므로 첫 실행을 덮지 않는다.
 */
export function resolveInitialLocale(stored?: string | null): string {
  if (stored && PRIMARY_LOCALES.includes(stored)) return stored
  return DEFAULT_LOCALE
}

/** 기기 언어는 1급 로케일(ko/en/mn)만 채택. 그 외는 en. 첫 실행 기본값으로는 쓰지 않는다. */
export function detectDeviceLocale(tag?: string | null): string {
  if (!tag) return DEVICE_FALLBACK
  const language = tag.trim().toLowerCase().replace('_', '-').split('-')[0]
  if (PRIMARY_LOCALES.includes(language)) return language
  return DEVICE_FALLBACK
}
