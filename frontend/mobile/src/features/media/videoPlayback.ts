import { extractYoutubeVideoId } from '../../domain/videoUrl'

export type VideoPlaybackPlan =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'unsupported' }

/**
 * 공개 영상 재생은 웹과 같이 YouTube embed만 연다.
 * TikTok·Instagram 등 외부 제공자는 재생한 것처럼 그리지 않는다.
 */
export function planVideoPlayback(raw: string | null | undefined): VideoPlaybackPlan {
  const id = extractYoutubeVideoId(raw ?? '')
  if (!id) return { kind: 'unsupported' }
  const params = new URLSearchParams({
    controls: '1',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
  })
  return { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}?${params.toString()}` }
}
