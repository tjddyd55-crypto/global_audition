/** Integer minor-unit display. Does not use binary floating point. */
export function formatMinorAmount(amountMinor: number, scale: number, currency: string): string {
  if (!Number.isInteger(amountMinor) || !Number.isInteger(scale) || scale < 0 || scale > 8) {
    return ''
  }
  const negative = amountMinor < 0
  const digits = Math.abs(amountMinor).toString().padStart(scale + 1, '0')
  const whole = scale === 0 ? digits : digits.slice(0, -scale)
  const fraction = scale === 0 ? '' : digits.slice(-scale)
  const shown = scale === 0 ? whole : `${whole}.${fraction}`
  return `${negative ? '-' : ''}${shown} ${currency}`
}
