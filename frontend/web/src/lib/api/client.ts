import axios, { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/lib/auth/authStore'
import { getStoredAccessToken } from './authToken'

/** 동일 Origin: `/api/*` → Next.js rewrite → 백엔드 */
const API_PATH_PREFIX = '/api'

export const apiClient = axios.create({
  baseURL: API_PATH_PREFIX,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  /** 세션 쿠키·크로스 오리진 시 자격 증명 전송. 업로드 등은 요청별로도 `withCredentials: true` 명시 가능. */
  withCredentials: true,
})

function getRequestAuthorizationHeader(config: InternalAxiosRequestConfig | undefined): string | undefined {
  const h = config?.headers
  if (!h) return undefined
  if (typeof (h as { get?: (k: string) => unknown }).get === 'function') {
    const v = (h as { get: (k: string) => unknown }).get('Authorization')
    if (typeof v === 'string') return v
    const v2 = (h as { get: (k: string) => unknown }).get('authorization')
    return typeof v2 === 'string' ? v2 : undefined
  }
  const rec = h as Record<string, unknown>
  const a = rec.Authorization ?? rec.authorization
  return typeof a === 'string' ? a : undefined
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.baseURL) {
      config.baseURL = API_PATH_PREFIX
    }

    const token = getStoredAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else if (
      process.env.NODE_ENV === 'development' &&
      typeof config.url === 'string' &&
      config.url.includes('/auth/me')
    ) {
      console.warn('[API Client] /auth/me 요청인데 localStorage에 토큰 없음 → Authorization 미설정')
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers
      if (h && typeof (h as { delete?: (k: string) => void }).delete === 'function') {
        ;(h as { delete: (k: string) => void }).delete('Content-Type')
      } else if (h && typeof h === 'object') {
        delete (h as Record<string, unknown>)['Content-Type']
      }
    }

    return config
  },
  (error) => {
    console.error('[API Client] Request Interceptor Error:', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const baseUrl = error.config?.baseURL || ''
    const path = error.config?.url || ''
    const fullUrl = `${baseUrl}${path}`

    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('[API Client] ❌ Request Error:', {
        fullUrl,
        method: (error.config?.method ?? '').toUpperCase() || 'UNKNOWN',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      })

      if (!error.response) {
        console.error('[API Client] 🚨 Network Error - Next.js `/api` rewrite 대상 백엔드·포트를 확인하세요.')
        console.error('[API Client] Details:', {
          url: fullUrl,
          message: error.message,
          code: error.code,
          baseURL: error.config?.baseURL || 'undefined',
        })
      }
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = String(error.config?.url ?? '')
      const isPublicAuthRoute =
        url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/forgot')
      const authHeader = getRequestAuthorizationHeader(error.config)
      const hadBearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')

      if (!isPublicAuthRoute && hadBearer) {
        useAuthStore.getState().clearAuth()
      }
    }
    return Promise.reject(error)
  }
)
