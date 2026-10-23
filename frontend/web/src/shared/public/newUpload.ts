export const NEW_UPLOAD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export function isNewUpload(publishedAt: string | null | undefined, now = Date.now()): boolean {
  if (!publishedAt) return false
  const time = new Date(publishedAt).getTime()
  if (Number.isNaN(time)) return false
  const age = now - time
  return age >= 0 && age < NEW_UPLOAD_WINDOW_MS
}
