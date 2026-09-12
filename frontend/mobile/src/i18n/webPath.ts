import { getRuntimeLocale } from './runtime'

/** WebView canonical 경로에 locale prefix를 붙인다. */
export function localeWebPath(path: string): string {
  const locale = getRuntimeLocale()
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized.startsWith(`/${locale}/`)) return normalized
  return `/${locale}${normalized}`
}
