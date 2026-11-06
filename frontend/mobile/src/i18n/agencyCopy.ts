import localesMeta from '../../../web/messages/locales.json'
import i18n from './index'
import { PRIMARY_LOCALES } from './runtime'

/**
 * 기획사·관리자 화면의 카탈로그 로케일.
 * 지원생이 고른 ko/en/mn 은 i18n.language 에 그대로 둔다.
 */
export const AGENCY_UI_LOCALE = PRIMARY_LOCALES.includes(localesMeta.agencyUiLocale)
  ? localesMeta.agencyUiLocale
  : 'ko'

export function agencyCopy(key: string, options?: Record<string, unknown>): string {
  const fixed = i18n.getFixedT(AGENCY_UI_LOCALE)
  const value = options ? fixed(key, options) : fixed(key)
  return typeof value === 'string' ? value : String(value)
}
