import { API_BASE_URL } from '@/lib/env'
import { getStoredAccessToken } from './authToken'

/**
 * 백엔드 API 절대 URL (`NEXT_PUBLIC_API_URL` + `/api` + path)
 * @param apiPath `/` 로 시작 권장. 예: `/credits/balance`, `/v1/points/balance`
 */
export function apiUrl(apiPath: string): string {
  if (apiPath.startsWith('http://') || apiPath.startsWith('https://')) {
    return apiPath
  }
  const p = apiPath.startsWith('/') ? apiPath : `/${apiPath}`
  return `${API_BASE_URL}/api${p}`
}

export class ApiFetchError extends Error {
  readonly status: number
  readonly bodyText: string
  /** 요청 최종 URL (fetch Response.url — 리다이렉트 후 값) */
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
  /**
   * 기본: `undefined` → Bearer 부착 시도(토큰 있을 때만).
   * `false`: Authorization 헤더를 넣지 않음 → **로그인·권한 필수 API에 쓰면 401/403** (서버가 익명 허용하는 공개 GET 전용).
   * 서버 권한은 항상 서버에서 검증됨; `auth: false`는 “클라이언트가 토큰을 안 보냄”일 뿐, 보호 API를 “뚫어” 주지 않음.
   */
  auth?: boolean
}

/**
 * fetch 기반 공통 호출 — credentials + (기본) JSON Content-Type + Bearer
 * - Bearer: `options.auth !== false` 이고 저장된 토큰이 있을 때만 설정.
 * - FormData 본문일 때는 Content-Type을 건드리지 않음(브라우저 boundary 유지).
 */
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

/** 공개 엔드포인트 전용 — `apiFetch(path, { auth: false })` 와 동일, 의도를 이름으로 드러냄 */
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
