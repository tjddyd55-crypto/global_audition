import { extractYoutubeVideoId } from '@/shared/audition/youtubeEmbed'

/**
 * YouTube URL에서 영상 ID 추출
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * YouTube URL이 유효한지 검증
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null
}

/**
 * YouTube 영상 ID로 썸네일 URL 생성
 */
export function generateThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

/**
 * YouTube 영상 ID로 임베드 URL 생성
 */
export function generateEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`
}
