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
