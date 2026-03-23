import axios, { InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/lib/env'
import { useAuthStore } from '@/lib/auth/authStore'
import { getStoredAccessToken } from './authToken'

// API_BASE_URL은 env.ts에서 빌드 타임에 검증됨
// NEXT_PUBLIC_API_URL이 없으면 빌드가 실패합니다

// 잘못된 URL 감지 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
    console.error('[API Client] ⚠️ 로컬 호스트 URL 감지 - 프로덕션에서는 Gateway URL을 사용해야 합니다!')
  }
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  /** CORS allowCredentials(true) 백엔드와 정합; Bearer는 인터셉터에서 계속 붙임 */
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

// 요청 인터셉터 (인증 토큰 추가 및 디버깅)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // baseURL 보장 (안전 처리)
    if (!config.baseURL) {
      // API_BASE_URL은 env.ts에서 이미 검증되었으므로 항상 존재함
      config.baseURL = `${API_BASE_URL}/api`
      if (process.env.NODE_ENV === 'development') {
        console.error('[API Client] ⚠️ config.baseURL이 없어서 재설정:', config.baseURL)
      }
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

    return config
  },
  (error) => {
    console.error('[API Client] Request Interceptor Error:', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 에러 상세 로깅 (안전 처리)
    const baseUrl = error.config?.baseURL || ''
    const path = error.config?.url || ''
    const fullUrl = `${baseUrl}${path}`
    
    // 프로덕션에서는 에러 로그 최소화, 개발 환경에서만 상세 로그
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
      
      // 네트워크 에러 (서버에 도달하지 못함)
      if (!error.response) {
        console.error('[API Client] 🚨 Network Error - 요청이 서버에 도달하지 못했습니다!')
        console.error('[API Client] Details:', {
          url: fullUrl,
          message: error.message,
          code: error.code,
          baseURL: error.config?.baseURL || 'undefined',
        })
        
        if (!error.config?.baseURL || error.config.baseURL.includes('undefined')) {
          console.error('[API Client] 🔴 Critical: baseURL이 설정되지 않았습니다!')
          console.error('[API Client] NEXT_PUBLIC_API_URL 환경 변수를 확인하세요.')
        }
      }
    }
    
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = String(error.config?.url ?? '')
      const isPublicAuthRoute =
        url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/forgot')
      const authHeader = getRequestAuthorizationHeader(error.config)
      const hadBearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')

      // Bearer를 보낸 요청만 세션 정리 (로그인 실패 401 등은 제외). 전역 location 리다이렉트 금지 → /me 루프·깜빡임 방지.
      if (!isPublicAuthRoute && hadBearer) {
        useAuthStore.getState().clearAuth()
      }
    }
    return Promise.reject(error)
  }
)
