import localesMeta from '../../../web/messages/locales.json'

export const SUPPORTED_LOCALES = localesMeta.supported as readonly string[]
export const PRIMARY_LOCALES = localesMeta.primary as readonly string[]
export const DEFAULT_LOCALE = localesMeta.defaultLocale
export const DEVICE_FALLBACK = localesMeta.deviceFallback

let currentLocale = DEFAULT_LOCALE

export function setRuntimeLocale(locale: string) {
  currentLocale = normalizeLocale(locale)
}

export function getRuntimeLocale(): string {
  return currentLocale
}

export function normalizeLocale(raw?: string | null): string {
  if (!raw) return DEVICE_FALLBACK
  const language = raw.trim().toLowerCase().replace('_', '-').split('-')[0]
  if (SUPPORTED_LOCALES.includes(language)) return language
  return DEVICE_FALLBACK
}

/** 기기 언어는 1급 로케일(ko/en/mn)만 채택. 그 외는 en. */
export function detectDeviceLocale(tag?: string | null): string {
  if (!tag) return DEVICE_FALLBACK
  const language = tag.trim().toLowerCase().replace('_', '-').split('-')[0]
  if (PRIMARY_LOCALES.includes(language)) return language
  return DEVICE_FALLBACK
}
