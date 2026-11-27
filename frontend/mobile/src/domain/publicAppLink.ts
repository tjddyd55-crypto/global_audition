import { normalizeUiLocale } from '../../../web/src/shared/i18n/uiLocales'

const ID = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'
const ENTITY = new RegExp(`^/([^/]+)/(auditions|channel)/(${ID})(/vote)?/?$`, 'i')
const UUID = new RegExp(`^${ID}$`, 'i')

export function publicAppLink(raw: string, webOrigin: string): string {
  if (!/^https?:/i.test(raw)) return raw
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.origin !== new URL(webOrigin).origin || url.username || url.password) return '/'
    const match = ENTITY.exec(url.pathname)
    if (!match) return '/'
    const [, language, entity, id, vote] = match
    const locale = normalizeUiLocale(language)
    if (!locale || (vote && entity !== 'auditions')) return '/'
    const params = new URLSearchParams({ linkLocale: locale })
    if (vote) {
      const round = url.searchParams.get('round')
      const candidate = url.searchParams.get('candidate')
      if (round && /^[1-9]\d{0,8}$/.test(round)) params.set('round', round)
      if (candidate && UUID.test(candidate)) params.set('candidate', candidate)
    }
    return `/${entity}/${id}${vote ?? ''}?${params}`
  } catch {
    return '/'
  }
}
