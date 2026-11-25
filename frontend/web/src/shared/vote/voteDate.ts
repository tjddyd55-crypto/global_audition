/** Display precision only; vote eligibility continues to come from the server. */
export function formatVoteDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
  try {
    // Some browsers omit Khmer/Mongolian ICU data; avoid silently using the device language.
    const supported = Intl.DateTimeFormat.supportedLocalesOf([locale])[0]
    return new Intl.DateTimeFormat(supported || 'en', options).format(date)
  } catch {
    return new Intl.DateTimeFormat('en', options).format(date)
  }
}
