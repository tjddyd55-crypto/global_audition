/**
 * YouTube URL 관련 유틸리티 함수
 */

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
  if (!url) return false
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url)
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
  return `https://www.youtube.com/embed/${videoId}`
}
