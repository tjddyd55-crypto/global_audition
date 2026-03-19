/**
 * API/렌더 null-safe 기본값 (크래시 방지)
 *
 * Audition 등 배열 필드: 반드시 safeStringArr / safeArr 로만 정규화한 뒤 map — raw dto 배열에 직접 map 금지.
 */
export function safeStr(x: unknown): string {
  if (x == null) return ''
  return String(x).trim()
}

export function safeArr<T>(x: T[] | null | undefined): T[] {
  return Array.isArray(x) ? x : []
}

/** API JSON 배열 → 항상 string[] (null/비배열 → []). 요소 trim 후 빈 문자열 제거. */
export function safeStringArr(x: unknown): string[] {
  if (!Array.isArray(x)) return []
  const out: string[] = []
  for (const item of x) {
    if (typeof item !== 'string') continue
    const t = item.trim()
    if (t.length > 0) out.push(t)
  }
  return out
}

export function safeNum(x: unknown): number {
  const n = Number(x ?? 0)
  return Number.isFinite(n) ? n : 0
}
