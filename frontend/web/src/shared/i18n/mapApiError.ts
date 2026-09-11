/** 서버 원문 한글 대신 카탈로그 코드 매핑을 우선한다. */
export function mapApiErrorCode(
  body: unknown,
  translate: (key: string) => string,
  fallback: string,
): string {
  const rec = body && typeof body === 'object' ? (body as { code?: unknown; message?: unknown }) : null
  const code = typeof rec?.code === 'string' ? rec.code.trim() : ''
  if (code) {
    const key = `errors.${code}`
    const mapped = translate(key)
    if (mapped && mapped !== key) return mapped
  }
  const message = typeof rec?.message === 'string' ? rec.message.trim() : ''
  if (message === '크레딧이 부족합니다.') {
    const mapped = translate('errors.INSUFFICIENT_CREDITS')
    if (mapped && mapped !== 'errors.INSUFFICIENT_CREDITS') return mapped
  }
  if (message) {
    const asCode = `errors.${message}`
    const mapped = translate(asCode)
    if (mapped && mapped !== asCode) return mapped
  }
  return fallback
}
