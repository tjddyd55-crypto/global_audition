import i18n from '../i18n'

function readCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const rec = body as { code?: unknown; error?: unknown }
  if (typeof rec.code === 'string' && rec.code.trim()) return rec.code.trim()
  if (typeof rec.error === 'string' && rec.error.trim()) return rec.error.trim()
  return null
}

function readRawMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const rec = body as { message?: unknown }
  if (typeof rec.message === 'string' && rec.message.trim()) return rec.message.trim()
  return null
}

/** 서버 한글/원문 대신 카탈로그 코드 매핑을 우선한다. */
export function mapApiError(body: unknown, fallback: string): string {
  const code = readCode(body)
  if (code) {
    const key = `errors.${code}`
    const mapped = i18n.t(key)
    if (mapped && mapped !== key) return mapped
  }
  const raw = readRawMessage(body)
  if (raw === '크레딧이 부족합니다.') return i18n.t('errors.INSUFFICIENT_CREDITS')
  if (raw) {
    const asCode = `errors.${raw}`
    const mapped = i18n.t(asCode)
    if (mapped && mapped !== asCode) return mapped
  }
  return fallback || i18n.t('errors.REQUEST_FAILED')
}
