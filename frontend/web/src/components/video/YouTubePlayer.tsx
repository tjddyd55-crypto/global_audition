'use client'

import { useTranslations } from 'next-intl'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'

interface YouTubePlayerProps {
  videoUrl: string
  embedUrl?: string
  width?: string | number
  height?: string | number
  className?: string
}

/**
 * YouTube 영상: watch URL은 파싱만 하고 iframe embed로만 로드 (youtube.com에 XHR/fetch 없음)
 */
export default function YouTubePlayer({
  videoUrl,
  embedUrl,
  width = '100%',
  height = 400,
  className = '',
}: YouTubePlayerProps) {
  const tVideo = useTranslations('video')
  const finalEmbedUrl = embedUrl?.trim() || getVideoEmbedSrc(videoUrl) || ''

  if (!finalEmbedUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width, height }}>
        <p className="text-gray-500">{tVideo('invalidYoutubeUrl')}</p>
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
        frameBorder={0}
      />
    </div>
  )
}
