import { extractYoutubeVideoId, getYoutubeId } from '@/shared/audition/youtubeEmbed'

/** watch·embed·shorts 등 HTML 페이지 — img.youtube.com 은 제외 */
function isYoutubeNonImagePageUrl(s: string): boolean {
  const t = s.trim().toLowerCase()
  if (!t || t.includes('img.youtube.com')) return false
  return t.includes('youtu.be') || t.includes('youtube.com')
}

/**
 * 썸네일 필드에 watch/embed URL이 들어온 경우 정적 이미지 URL로 치환.
 * youtube.com HTML을 이미지로 fetch하지 않도록 해 CORS·콘솔 오류를 방지 (네트워크 호출 없음).
 */
export function resolveThumbnailDisplayUrl(stored: string | null | undefined): string | null {
  const s = stored?.trim()
  if (!s) return null
  if (!isYoutubeNonImagePageUrl(s)) return s
  const id = getYoutubeId(s) ?? extractYoutubeVideoId(s)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

/** 저장된 썸네일이 없을 때 YouTube 정적 썸네일 URL — youtube.com 직접 요청 없음 */
export function resolveVideoThumbnailUrl(
  videoUrl: string,
  storedThumbnail?: string | null
): string | null {
  const stored = storedThumbnail?.trim()
  if (stored) {
    const normalized = resolveThumbnailDisplayUrl(stored)
    if (normalized) return normalized
    if (!isYoutubeNonImagePageUrl(stored)) return stored
  }
  const id = getYoutubeId(videoUrl) ?? extractYoutubeVideoId(videoUrl)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}
