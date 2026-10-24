/**
 * DEV/DUMMY 이미지 (모바일 웹 미리보기 전용).
 * 실제 썸네일이 없는 공고에만 audition id 기반으로 결정적으로 선택된다.
 * 출처·라이선스: public/dev-assets/README.md
 */
export const DEV_HERO_IMAGE = '/dev-assets/hero-stage.webp'

export const DEV_AUDITION_THUMBNAILS = [
  '/dev-assets/thumb-mic.webp',
  '/dev-assets/thumb-dance.webp',
  '/dev-assets/thumb-vocalist.webp',
  '/dev-assets/thumb-stage.webp',
] as const

/** 같은 id 는 항상 같은 더미 썸네일을 받는다 (FNV-1a 해시). */
export function devAuditionThumbnail(id: string | null | undefined): string {
  const key = String(id ?? '')
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return DEV_AUDITION_THUMBNAILS[(h >>> 0) % DEV_AUDITION_THUMBNAILS.length]
}
