/**
 * 오디션 공고 태그 SSOT (백엔드 AuditionTagNormalizer.ALLOWED_ORDERED 와 동일 순서·문자열).
 * 검색·필터·폼에서 공통 사용.
 */
export const AUDITION_TAG_OPTIONS = ['보컬', '댄서', '팀', '배우', '모델'] as const

export type AuditionTagOption = (typeof AUDITION_TAG_OPTIONS)[number]

const ALLOWED = new Set<string>(AUDITION_TAG_OPTIONS)

/** 클라이언트 페이로드용: 허용 목록만·중복 제거·선택 순서 유지 */
export function normalizeAuditionTagsForPayload(selected: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of selected) {
    const t = (raw ?? '').trim()
    if (!t || !ALLOWED.has(t) || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}
