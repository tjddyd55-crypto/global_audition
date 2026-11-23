/** 로그인·가입 뒤 돌아갈 내부 경로(쿼리 포함). 외부 주소·프로토콜 상대 주소는 막는다. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  const p = raw.trim()
  if (!p.startsWith('/') || p.startsWith('//') || p.includes('://') || p.includes('\\')) return null
  return p
}

/** 가입 화면으로 넘길 때 next 를 그대로 붙인다. */
export function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path
}
