/** videoUrl → iframe src (YouTube 위주) */
export type VideoEmbedOptions = {
  /** 모달 등 사용자 제스처 직후 재생용. 인라인 페이지 임베드에는 기본 false 권장 */
  autoplay?: boolean
}

function appendQueryParam(embedUrl: string, key: string, value: string): string {
  const sep = embedUrl.includes('?') ? '&' : '?'
  return `${embedUrl}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

function buildYoutubeEmbedPath(id: string, options?: VideoEmbedOptions): string | null {
  if (!id) return null
  let url = `https://www.youtube.com/embed/${id}`
  url = appendQueryParam(url, 'controls', '1')
  url = appendQueryParam(url, 'modestbranding', '1')
  url = appendQueryParam(url, 'rel', '0')
  if (options?.autoplay) {
    // iOS/Safari: autoplay는 대개 mute + playsinline 과 함께여야 동작
    url = appendQueryParam(url, 'autoplay', '1')
    url = appendQueryParam(url, 'playsinline', '1')
    url = appendQueryParam(url, 'mute', '1')
  }
  return url
}

/** Shorts·세로형 유튜브 URL (임베드 비율 9:16 용) */
export function isYoutubeShortsLikeUrl(url: string): boolean {
  const u = (url ?? '').trim()
  if (!u) return false
  try {
    const parsed = new URL(u)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host !== 'youtu.be' && !host.includes('youtube.com')) return false
    return /\/shorts\//i.test(parsed.pathname)
  } catch {
    return false
  }
}

export function getVideoEmbedSrc(url: string, options?: VideoEmbedOptions): string | null {
  const u = (url ?? '').trim()
  if (!u) return null
  try {
    const parsed = new URL(u)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '')
      return buildYoutubeEmbedPath(id, options)
    }
    if (host.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v) return buildYoutubeEmbedPath(v, options)
      const m = parsed.pathname.match(/\/embed\/([^/?]+)/)
      if (m) return buildYoutubeEmbedPath(m[1], options)
      const shorts = parsed.pathname.match(/\/shorts\/([^/?]+)/)
      if (shorts?.[1]) return buildYoutubeEmbedPath(shorts[1], options)
    }
  } catch {
    return null
  }
  return null
}
