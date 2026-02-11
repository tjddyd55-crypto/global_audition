import axios, { InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/lib/env'

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
})

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
    
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('accessToken') || localStorage.getItem('auth_token'))
      : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
        method: error.config?.method?.toUpperCase() || 'UNKNOWN',
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
    
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
