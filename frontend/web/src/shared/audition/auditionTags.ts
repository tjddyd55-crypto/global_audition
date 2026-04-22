/**
 * 직접 입력 태그 페이로드 정리 (백엔드 AuditionTagService 와 동일 한도 120자).
 */
export function normalizeCustomTagNamesForPayload(raw: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const s of raw) {
    let t = (s ?? '').trim()
    if (!t) continue
    if (t.length > 120) t = t.slice(0, 120).trim()
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

/** @deprecated 레거시 API 전용 — 서버 tagIds/customTagNames 사용 권장 */
export function normalizeAuditionTagsForPayload(selected: string[]): string[] {
  return normalizeCustomTagNamesForPayload(selected)
}
