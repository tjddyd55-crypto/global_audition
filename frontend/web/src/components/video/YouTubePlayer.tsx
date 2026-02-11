'use client'

interface YouTubePlayerProps {
  videoUrl: string
  embedUrl?: string
  width?: string | number
  height?: string | number
  className?: string
}

/**
 * YouTube 영상 재생 컴포넌트
 * videoUrl 또는 embedUrl을 받아서 YouTube iframe으로 재생
 */
export default function YouTubePlayer({
  videoUrl,
  embedUrl,
  width = '100%',
  height = 400,
  className = '',
}: YouTubePlayerProps) {
  // embedUrl이 제공되면 사용, 없으면 videoUrl에서 추출
  const finalEmbedUrl = embedUrl || extractEmbedUrl(videoUrl)

  if (!finalEmbedUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width, height }}>
        <p className="text-gray-500">유효한 YouTube URL이 아닙니다</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <iframe
        src={finalEmbedUrl}
        width="100%"
        height="100%"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0"
        frameBorder="0"
      />
    </div>
  )
}

/**
 * YouTube URL에서 임베드 URL 추출
 */
function extractEmbedUrl(url: string): string | null {
  if (!url) return null

  // 이미 embed URL인 경우
  if (url.includes('youtube.com/embed/')) {
    return url
  }

  // YouTube 영상 ID 추출
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }

  return null
}
