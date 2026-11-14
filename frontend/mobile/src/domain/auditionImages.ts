import type { AuditionDto, AuditionImages } from '../api/types'

const RESIZE_KEYS = new Set(['w', 'width', 'h', 'height', 'resize', 'q', 'quality', 'fm', 'format', 'fit', 'dpr'])

export function stripImageUrlResizeParams(url: string): string {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed
  try {
    const parsed = new URL(trimmed)
    for (const key of [...parsed.searchParams.keys()]) {
      if (RESIZE_KEYS.has(key.toLowerCase()) || /^[wh]_/i.test(key)) {
        parsed.searchParams.delete(key)
      }
    }
    return `${parsed.origin}${parsed.pathname}${parsed.search}`
  } catch {
    return trimmed
  }
}

export function auditionListImageUrl(images?: AuditionImages | null): string {
  const raw = (images?.original || images?.medium || images?.thumb || '').trim()
  return stripImageUrlResizeParams(raw)
}

export function auditionDetailImageUrl(images?: AuditionImages | null): string {
  return auditionListImageUrl(images)
}

export function auditionHeadlineTitle(audition: Pick<AuditionDto, 'displayTitle' | 'title'>): string {
  return audition.displayTitle?.trim() || audition.title
}

export const POSTER_ASPECT = 16 / 9

/**
 * 앱 <Image> 가 실제로 그릴 수 있는 커버 URL 인지.
 * - 웹 전용 상대 경로(`/audition-cover-placeholder.svg` 등)는 앱에서 회색 빈 칸이 된다.
 * - RN Image 는 SVG 를 그리지 못한다.
 * 그릴 수 없으면 앱 자체 placeholder 를 보여 준다. (DB 데이터는 건드리지 않는다)
 */
export function isRenderablePosterUri(uri?: string | null): boolean {
  const value = uri?.trim() ?? ''
  if (!value) return false
  if (/^data:image\/svg/i.test(value)) return false
  if (/^data:image\//i.test(value)) return true
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:' && parsed.protocol !== 'file:') return false
  if (/\.svgz?$/i.test(parsed.pathname)) return false
  return true
}
