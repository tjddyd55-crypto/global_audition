const CANCEL_CODES = new Set([
  'PAY_PROCESS_CANCELED',
  'PAY_PROCESS_CANCELLED',
  'PAYER_CANCELED',
  'PAYER_CANCELLED',
  'USER_CANCEL',
  'CANCELED_BY_USER',
  'CANCELLED_BY_USER',
])

export function isTossCancelCode(code: string | null | undefined): boolean {
  if (!code) {
    return false
  }
  const normalized = code.trim().toUpperCase()
  if (CANCEL_CODES.has(normalized)) {
    return true
  }
  return normalized.includes('CANCEL')
}
