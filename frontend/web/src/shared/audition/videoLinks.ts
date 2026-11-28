import { extractYoutubeVideoId } from './youtubeEmbed'
import { bilibiliLink } from './bilibili'

export function isEmbeddableVideoLink(raw: string): boolean {
  return Boolean(bilibiliLink(raw) || extractYoutubeVideoId(raw))
}

export function isValidAuditionVideoLink(raw: string): boolean {
  if (isEmbeddableVideoLink(raw)) return true
  const value = raw.trim()
  if (!value) return false
  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value)
    if (u.username || u.password || u.port || /[\\\s]/.test(value)) return false
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return u.pathname.replace(/^\/+/, '').length > 0
    return host === 'instagram.com' && /\/(reel|reels|p|tv)\//i.test(u.pathname)
  } catch {
    return false
  }
}
