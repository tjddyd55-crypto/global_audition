import { extractYoutubeVideoId } from './videoUrl'

/** YouTube watch/youtu.be → embed URL (외부 WebView 임베드용). */
export function getVideoEmbedSrc(url: string): string | null {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return null
  const id = extractYoutubeVideoId(trimmed)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}?controls=1&modestbranding=1&rel=0&playsinline=1`
}
