import { bilibiliEmbed, bilibiliLink } from '@/shared/audition/bilibili'
import { extractYoutubeVideoId } from '@/shared/audition/youtubeEmbed'

/**
 * videoUrl → iframe embed src (YouTube).
 * watch·youtu.be 는 정규식만으로 ID 추출 — fetch/axios로 youtube.com 요청하지 않음.
 */
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
  // 쿠키 없는 embed 도메인 + 관련 영상 최소화 + 인라인 재생(앱·모바일에서 YouTube 로 넘어가지 않게)
  let url = `https://www.youtube-nocookie.com/embed/${id}`
  url = appendQueryParam(url, 'controls', '1')
  url = appendQueryParam(url, 'modestbranding', '1')
  url = appendQueryParam(url, 'rel', '0')
  url = appendQueryParam(url, 'playsinline', '1')
  if (options?.autoplay) {
    // 모달은 사용자 클릭 직후 로드 → 음성 포함 자동재생이 허용되는 경우가 많음 (브라우저 정책에 따라 재생만 되고 소리는 막힐 수 있음)
    url = appendQueryParam(url, 'autoplay', '1')
  }
  return url
}

/** Shorts·세로형 유튜브 URL (임베드 비율 9:16 용) */
export function isYoutubeShortsLikeUrl(url: string): boolean {
  const u = (url ?? '').trim()
  if (!u) return false
  try {
    const normalized = /^https?:\/\//i.test(u) ? u : `https://${u}`
    const parsed = new URL(normalized)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host !== 'youtu.be' && !['youtube.com','m.youtube.com','music.youtube.com'].includes(host)) return false
    return /\/shorts\//i.test(parsed.pathname)
  } catch {
    return false
  }
}

export function getVideoEmbedSrc(url: string, options?: VideoEmbedOptions): string | null {
  const u = (url ?? '').trim()
  if (!u) return null
  const bilibili = bilibiliLink(u)
  if (bilibili?.kind === 'video') return bilibiliEmbed(bilibili, options?.autoplay)
  const id = extractYoutubeVideoId(u)
  if (!id) return null
  return buildYoutubeEmbedPath(id, options)
}
