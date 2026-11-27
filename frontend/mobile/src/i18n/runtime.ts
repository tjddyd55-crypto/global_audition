import localesMeta from '../../../web/messages/locales.json'
import { normalizeUiLocale } from '../../../web/src/shared/i18n/uiLocales'

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
  return normalizeUiLocale(raw) ?? DEVICE_FALLBACK
}

/**
 * 저장된 선택이 없으면 영어.
 * 기기 언어는 저장값이 아니므로 첫 실행을 덮지 않는다.
 */
export function resolveInitialLocale(stored?: string | null): string {
  if (stored && PRIMARY_LOCALES.includes(stored)) return stored
  return stored && /^zh(?:[-_]|$)/i.test(stored) ? normalizeLocale(stored) : DEFAULT_LOCALE
}

/** 기기 언어는 1급 로케일(ko/en/mn/km/uz)만 채택. 그 외는 en. 첫 실행 기본값으로는 쓰지 않는다. */
export function detectDeviceLocale(tag?: string | null): string {
  return normalizeLocale(tag)
}

/** 언어 메뉴에 보이는 자국어 이름. 카탈로그 번역과 무관하게 항상 그 언어로 표시한다. */
export const LOCALE_NATIVE_NAMES: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  mn: 'Монгол',
  km: 'ខ្មែរ',
  uz: 'Oʻzbekcha',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
}

export function nativeLanguageName(code: string): string {
  return LOCALE_NATIVE_NAMES[code] ?? code.toUpperCase()
}
