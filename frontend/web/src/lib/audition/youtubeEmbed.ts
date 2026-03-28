/** youtube.com/watch?v= · youtu.be/ 형식(단순 공유 URL) */
export function getYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
  const match = (url ?? '').trim().match(regExp)
  return match ? match[1] : null
}

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
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const v = u.searchParams.get('v')
      if (v && v.length >= 6) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const i = parts.indexOf('embed')
      if (i >= 0 && parts[i + 1]) return parts[i + 1]
      const si = parts.indexOf('shorts')
      if (si >= 0 && parts[si + 1]) return parts[si + 1]
      const li = parts.indexOf('live')
      if (li >= 0 && parts[li + 1]) return parts[li + 1]
      const vi = parts.indexOf('v')
      if (vi >= 0 && parts[vi + 1]) return parts[vi + 1]
    }
  } catch {
    /* ignore */
  }
  return getYoutubeId(s)
}

/** 비어 있으면 true, 값이 있으면 YouTube로 해석 가능할 때만 true */
export function isBlankOrValidYoutubeUrl(raw: string): boolean {
  const s = (raw ?? '').trim()
  if (!s) return true
  return extractYoutubeVideoId(s) != null
}
