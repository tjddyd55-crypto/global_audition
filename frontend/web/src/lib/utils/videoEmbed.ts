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
  if (options?.autoplay) {
    url = appendQueryParam(url, 'autoplay', '1')
  }
  return url
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
