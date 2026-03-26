import { getStoredAccessToken } from './authToken'

/**
 * 브라우저·클라이언트 컴포넌트용 API URL (항상 동일 Origin `/api/...`).
 * Next.js rewrites가 서버에서 실제 백엔드로 전달한다.
 *
 * @param apiPath `/` 로 시작 권장. 예: `/health`, `/uploads/image`
 */
export function apiUrl(apiPath: string): string {
  if (apiPath.startsWith('http://') || apiPath.startsWith('https://')) {
    return apiPath
  }
  const p = apiPath.startsWith('/') ? apiPath : `/${apiPath}`
  return `/api${p}`
}

export class ApiFetchError extends Error {
  readonly status: number
  readonly bodyText: string
  readonly url: string

  constructor(status: number, bodyText: string, url = '') {
    super(`API ${status}: ${bodyText.slice(0, 200)}`)
    this.name = 'ApiFetchError'
    this.status = status
    this.bodyText = bodyText
    this.url = url
  }
}

export type ApiFetchOptions = RequestInit & {
  auth?: boolean
}

export async function apiFetch(apiPath: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { auth: authOption, headers: initHeaders, ...rest } = options
  const attachBearer = authOption !== false

  const url = apiUrl(apiPath)
  const headers = new Headers(initHeaders as HeadersInit)

  const hasBody = rest.body !== undefined && rest.body !== null
  const isForm = typeof FormData !== 'undefined' && rest.body instanceof FormData
  if (!isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (attachBearer) {
    const token = getStoredAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  return fetch(url, {
    ...rest,
    credentials: rest.credentials ?? 'include',
    headers,
  })
}

export function apiFetchPublic(apiPath: string, options: Omit<ApiFetchOptions, 'auth'> = {}): Promise<Response> {
  return apiFetch(apiPath, { ...options, auth: false })
}

export async function apiFetchJson<T>(apiPath: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await apiFetch(apiPath, options)
  const text = await res.text()
  if (!res.ok) {
    throw new ApiFetchError(res.status, text, res.url)
  }
  if (res.status === 204 || text === '') {
    return undefined as T
  }
  return JSON.parse(text) as T
}
