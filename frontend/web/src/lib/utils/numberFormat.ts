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
