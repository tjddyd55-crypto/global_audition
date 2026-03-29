import { extractYoutubeVideoId } from '@/lib/audition/youtubeEmbed'
import type { VideoContent } from '@/lib/api/videos'

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

/** YouTube URL 또는 원문에서 영상 ID 추출. 없으면 trim 한 원문 그대로 반환(백엔드 추가 파싱). */
export function extractYouTubeId(urlOrRaw: string): string {
  const s = (urlOrRaw ?? '').trim()
  if (!s) return ''
  const id = extractYoutubeVideoId(s)
  return id ?? s
}

/**
 * PATCH /api/me 용 대표 영상 식별자: UUID면 그대로, URL·YT ID면 내 영상 목록에서 channel_video UUID로 치환.
 * 목록에 없으면 정규화된 값(URL이면 youtube id 등)을 그대로 두어 백엔드 매칭에 맡김.
 */
export function resolveFeaturedVideoIdForMePatch(raw: string, videos: VideoContent[]): string {
  const s = (raw ?? '').trim()
  if (!s) return ''
  if (UUID_RE.test(s)) return s
  const yt = extractYoutubeVideoId(s)
  if (yt) {
    const hit = videos.find((v) => {
      const u = v.videoUrl?.trim()
      if (!u) return false
      return extractYoutubeVideoId(u) === yt
    })
    if (hit) return hit.id
  }
  return s
}

/** 채널 분야: 한글 라벨·일반 표기 → 저장용 코드 (확장 시 여기만 추가). */
const CATEGORY_TO_API_CODE: Record<string, string> = {
  케이팝: 'KPOP',
  '케이 팝': 'KPOP',
  kpop: 'KPOP',
  KPOP: 'KPOP',
  보컬: 'VOCAL',
  vocal: 'VOCAL',
  VOCAL: 'VOCAL',
  트로트: 'TROT',
  trot: 'TROT',
  TROT: 'TROT',
  인플루언서: 'INFLUENCER',
  INFLUENCER: 'INFLUENCER',
}

export function mapChannelCategoryToApiCode(raw: string): string {
  const t = (raw ?? '').trim()
  if (!t) return t
  const direct = CATEGORY_TO_API_CODE[t]
  if (direct) return direct
  const lower = t.toLowerCase()
  for (const [key, code] of Object.entries(CATEGORY_TO_API_CODE)) {
    if (key.toLowerCase() === lower) return code
  }
  return t.length > 50 ? t.slice(0, 50) : t
}

export function mapChannelCategoriesForApi(categories: string[]): string[] {
  return categories.map(mapChannelCategoryToApiCode)
}
