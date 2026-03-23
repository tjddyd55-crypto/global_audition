/**
 * YouTube 공유/shorts/embed URL에서 11자 video id 추출 (미리보기용)
 */
export function extractYoutubeVideoId(raw: string): string | null {
  const s = (raw ?? '').trim()
  if (!s) return null
  if (/^[\w-]{11}$/.test(s)) return s
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id && id.length >= 6 ? id : null
    }
    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && v.length >= 6) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const i = parts.indexOf('embed')
      if (i >= 0 && parts[i + 1]) return parts[i + 1]
      const si = parts.indexOf('shorts')
      if (si >= 0 && parts[si + 1]) return parts[si + 1]
    }
  } catch {
    /* ignore */
  }
  return null
}
