/**
 * 풀폭 포스터 표시용: CDN·이미지 프록시가 붙인 축소/품질 쿼리를 제거해 원본에 가깝게 로드.
 * (data:/blob: 은 그대로 둠)
 */
const RESIZE_OR_QUALITY_KEYS = new Set([
  'w',
  'width',
  'h',
  'height',
  'resize',
  'q',
  'quality',
  'fm',
  'format',
  'fit',
  'dpr',
])

function shouldDeleteQueryKey(key: string): boolean {
  const lower = key.toLowerCase()
  if (RESIZE_OR_QUALITY_KEYS.has(lower)) return true
  if (/^[wh]_/i.test(lower)) return true
  return false
}

export function stripImageUrlResizeParams(url: string): string {
  const t = url.trim()
  if (!t) return t
  if (t.startsWith('data:') || t.startsWith('blob:')) return t

  try {
    let u: URL
    if (/^https?:\/\//i.test(t)) {
      u = new URL(t)
    } else if (t.startsWith('//')) {
      u = new URL(`https:${t}`)
    } else {
      u = new URL(t, 'https://image-display-normalize.invalid')
    }

    for (const k of [...u.searchParams.keys()]) {
      if (shouldDeleteQueryKey(k)) u.searchParams.delete(k)
    }

    const pathQs = `${u.pathname}${u.search}`

    if (/^https?:\/\//i.test(t)) {
      return `${u.origin}${pathQs}`
    }
    if (t.startsWith('//')) {
      return `//${u.host}${pathQs}`
    }
    if (t.startsWith('/')) {
      return pathQs
    }
    return pathQs.startsWith('/') ? pathQs.slice(1) : pathQs
  } catch {
    return t
  }
}
