/** videoUrl → iframe src (YouTube 위주) */
export function getVideoEmbedSrc(url: string): string | null {
  const u = (url ?? '').trim()
  if (!u) return null
  try {
    const parsed = new URL(u)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const m = parsed.pathname.match(/\/embed\/([^/?]+)/)
      if (m) return `https://www.youtube.com/embed/${m[1]}`
      const shorts = parsed.pathname.match(/\/shorts\/([^/?]+)/)
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`
    }
  } catch {
    return null
  }
  return null
}
