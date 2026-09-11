/**
 * 백엔드 SocialVideoUrls + YoutubeUrls 허용 규칙을 클라이언트 UX용으로 미러링한다.
 * 최종 검증은 ApplicationValidationService가 SSOT다.
 */

function hostOf(raw: string): { host: string; path: string; query: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    let host = url.hostname.toLowerCase()
    if (host.startsWith('www.')) host = host.slice(4)
    return { host, path: url.pathname, query: url.search }
  } catch {
    return null
  }
}

export function extractYoutubeVideoId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed

  const watch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  if (watch?.[1] && watch[1].length >= 6) return watch[1]

  const parsed = hostOf(trimmed)
  if (!parsed) return null

  if (parsed.host === 'youtu.be') {
    const id = parsed.path.replace(/^\/+/, '').split('/')[0]
    return id && id.length >= 6 ? id : null
  }

  if (parsed.host.includes('youtube.com') || parsed.host.includes('youtube-nocookie.com')) {
    const v = new URLSearchParams(parsed.query.replace(/^\?/, '')).get('v')
    if (v && v.length >= 6) return v
    const parts = parsed.path.split('/')
    for (let i = 0; i < parts.length; i += 1) {
      if ((parts[i] === 'embed' || parts[i] === 'shorts' || parts[i] === 'live') && parts[i + 1]?.length >= 6) {
        return parts[i + 1]
      }
    }
  }
  return null
}

function isTikTokHost(host: string): boolean {
  return host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'vt.tiktok.com' || host.endsWith('.tiktok.com')
}

function isInstagramVideoPath(path: string): boolean {
  const p = path.toLowerCase()
  return p.includes('/reel/') || p.includes('/reels/') || p.includes('/p/') || p.includes('/tv/')
}

export function isValidAuditionVideoUrl(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  if (extractYoutubeVideoId(trimmed)) return true
  const parsed = hostOf(trimmed)
  if (!parsed) return false
  if (isTikTokHost(parsed.host)) return parsed.path.replace(/^\/+/, '').length > 0
  if (parsed.host === 'instagram.com') return isInstagramVideoPath(parsed.path)
  return false
}

export function youtubeThumbnailUrl(raw: string): string | null {
  const id = extractYoutubeVideoId(raw)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export const VIDEO_URL_HINT = '영상 링크는 YouTube, TikTok, Instagram 영상 주소만 입력할 수 있습니다.'
