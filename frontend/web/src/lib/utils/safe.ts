/**
 * API/렌더 null-safe 기본값 (크래시 방지)
 */
export function safeStr(x: unknown): string {
  if (x == null) return ''
  return String(x).trim()
}

export function safeArr<T>(x: T[] | null | undefined): T[] {
  return Array.isArray(x) ? x : []
}

export function safeStringArr(x: unknown): string[] {
  if (!Array.isArray(x)) return []
  return x.filter((item): item is string => typeof item === 'string')
}

export function safeNum(x: unknown): number {
  const n = Number(x ?? 0)
  return Number.isFinite(n) ? n : 0
}
