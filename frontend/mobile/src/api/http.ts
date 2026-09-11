import { API_BASE_URL } from '../config/env'
import { clearSession, getAccessToken } from '../auth/secureSession'
import { readApiErrorMessage } from './unwrap'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | null | undefined>
  body?: unknown
  formData?: FormData
  auth?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${suffix}`)
  if (!query) return url.toString()
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function isPublicAuthPath(path: string): boolean {
  return path.includes('/auth/login') || path.includes('/auth/signup')
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  const token = options.auth === false ? null : await getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let body: BodyInit | undefined
  if (options.formData) {
    body = options.formData
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body,
  })

  const text = await response.text()
  const parsed: unknown = text ? parseJson(text) : null

  if (response.status === 401 && token && !isPublicAuthPath(path)) {
    await clearSession()
  }

  if (!response.ok) {
    throw new ApiError(response.status, readApiErrorMessage(parsed, `요청에 실패했습니다 (${response.status})`), parsed)
  }

  return parsed as T
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}
