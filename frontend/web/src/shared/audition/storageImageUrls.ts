/**
 * R2 업로드 키 규칙과 동일: 원본 `{prefix}/{uuid}_{name}.ext`, 파생 `{prefix}/t/{uuid}_{name}.ext`
 * (파생 확장자는 서버에서 jpg/png로 바뀔 수 있음.)
 *
 * 파생이 없는 구 URL·서드파티 URL은 변환 후 404가 날 수 있으므로 img onError에서 원본으로 폴백할 것.
 */
export function storageImageThumbUrl(originalPublicUrl: string): string {
  const s = originalPublicUrl.trim()
  if (!s) return s
  try {
    const base = new URL(s)
    const path = base.pathname
    if (/\/(audition|profile|thumbnail)\/(m|t)\//.test(path)) {
      return s
    }
    const next = path.replace(
      /\/(audition|profile|thumbnail)\/(?!m\/)(?!t\/)([^/]+)$/,
      '/$1/t/$2'
    )
    if (next === path) {
      return s
    }
    base.pathname = next
    return base.toString()
  } catch {
    return s
  }
}
