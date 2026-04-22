/** 숫자 문자열에 천 단위 콤마 (입력은 숫자만 가정). */
export function formatNumberDigits(value: string): string {
  const d = value.replace(/\D/g, '')
  if (!d) return ''
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function unformatNumber(value: string): string {
  return value.replace(/,/g, '')
}

/** 숫자만 남기고 콤마 포맷 — onChange 용 */
export function formatNumericInput(raw: string): string {
  return formatNumberDigits(raw)
}

export function parseNonNegativeInt(formatted: string, fallback = 0): number {
  const n = Number.parseInt(unformatNumber(formatted), 10)
  if (Number.isNaN(n) || n < 0) return fallback
  return n
}

/** USD 소수 입력: 숫자와 최대 한 개의 소수점, 소수부 2자리까지 */
export function formatUsdInput(raw: string): string {
  let s = raw.replace(/[^\d.]/g, '')
  const firstDot = s.indexOf('.')
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
    const [intPart, frac = ''] = s.split('.')
    s = intPart + '.' + frac.slice(0, 2)
  }
  return s
}

/** 관리자 폼 등: USD 문자열 → number (반올림 2자리) */
export function parseUsdDecimal(formatted: string, fallback = 0): number {
  const t = formatted.trim()
  if (!t) return fallback
  const n = Number.parseFloat(t.replace(/,/g, ''))
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.round(n * 100) / 100
}
