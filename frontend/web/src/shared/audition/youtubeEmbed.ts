const hosts = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
  'youtube-nocookie.com', 'www.youtube-nocookie.com',
])
const pathTypes = new Set(['embed', 'shorts', 'live', 'v'])

export function extractYoutubeVideoId(raw: string): string | null {
  const value = (raw ?? '').trim()
  if (/^[\w-]{11}$/.test(value)) return value
  if (!value || /[\s\\]/.test(value)) return null
  const url = /^https?:\/\//i.test(value) ? value : 'https://' + value
  if (!/^https?:\/\/[^/?#:@]+(?:[/?#]|$)/i.test(url)) return null
  try {
    const u = new URL(url)
    if (u.username || u.password || u.port) return null
    const [, kind, segment] = u.pathname.split('/')
    const shortHost = u.hostname === 'youtu.be' || u.hostname === 'www.youtu.be'
    if (!shortHost && !hosts.has(u.hostname)) return null
    const watch = u.pathname === '/watch'
      ? u.search.slice(1).split('&').find(part => part.startsWith('v='))?.slice(2)
      : undefined
    const id = shortHost ? kind : watch || (pathTypes.has(kind) ? segment : undefined)
    return id && /^[\w-]{6,}$/.test(id) ? id : null
  } catch {
    return null
  }
}

export function getYoutubeId(url: string): string | null {
  return extractYoutubeVideoId(url)
}

export function isBlankOrValidYoutubeUrl(raw: string): boolean {
  return !raw.trim() || extractYoutubeVideoId(raw) !== null
}
