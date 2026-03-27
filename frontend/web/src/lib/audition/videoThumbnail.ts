import { extractYoutubeVideoId } from '@/lib/audition/youtubeEmbed'

/** 저장된 썸네일이 없을 때 YouTube 정적 썸네일 URL */
export function resolveVideoThumbnailUrl(
  videoUrl: string,
  storedThumbnail?: string | null
): string | null {
  const stored = storedThumbnail?.trim()
  if (stored) return stored
  const id = extractYoutubeVideoId(videoUrl)
  if (!id) return null
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}
