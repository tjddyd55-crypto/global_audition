import axios, { InternalAxiosRequestConfig } from 'axios'

// Railway Gateway URL (프로덕션)
// Railway frontend-web 서비스에서 NEXT_PUBLIC_API_URL 환경 변수로 설정 필요
// Railway → frontend-web → Variables → NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
const getApiBaseUrl = (): string => {
  // Next.js 빌드 타임에 환경 변수가 하드코딩됨
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (envUrl && envUrl.trim() !== '') {
    // 끝의 슬래시 제거 및 공백 제거
    const trimmedUrl = envUrl.trim().replace(/\/+$/, '')
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
      console.log('[API Client] ✅ Using NEXT_PUBLIC_API_URL:', trimmedUrl)
    }
    return trimmedUrl
  }
  
  // 기본값: Gateway URL (프로덕션)
  const defaultUrl = 'https://gateway-production-72d6.up.railway.app'
  console.error('[API Client] ❌ NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다!')
  console.error('[API Client] Railway → frontend-web → Variables에서 NEXT_PUBLIC_API_URL을 설정해주세요.')
  console.warn('[API Client] ⚠️ 기본값 사용:', defaultUrl)
  return defaultUrl
}

const API_BASE_URL = getApiBaseUrl()

// baseURL 검증 (빌드 타임 + 런타임)
if (!API_BASE_URL || API_BASE_URL.trim() === '') {
  throw new Error('[API Client] API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_URL environment variable.')
}

// 최종 baseURL 로깅 (클라이언트 사이드)
if (typeof window !== 'undefined') {
  const fullApiUrl = `${API_BASE_URL}/api/v1`
  console.log('[API Client] 🔗 API Base URL:', fullApiUrl)
  
  // 잘못된 URL 감지
  if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
    console.error('[API Client] ⚠️ 로컬 호스트 URL 감지 - 프로덕션에서는 Gateway URL을 사용해야 합니다!')
  }
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
})

// 요청 인터셉터 (인증 토큰 추가 및 디버깅)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // baseURL 보장 (안전 처리)
    if (!config.baseURL) {
      const fallbackBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gateway-production-72d6.up.railway.app'
      config.baseURL = `${fallbackBaseUrl.replace(/\/+$/, '')}/api/v1`
      console.error('[API Client] ⚠️ config.baseURL이 없어서 기본값 사용:', config.baseURL)
    }
    
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 요청 URL 로깅 (디버깅용) - 안전 처리
    const baseUrl = config.baseURL || ''
    const path = config.url || ''
    const fullUrl = `${baseUrl}${path}`
    
    if (typeof window !== 'undefined') {
      console.log('[API Client] → Request:', {
        method: (config.method || 'GET').toUpperCase(),
        url: fullUrl,
        baseURL: config.baseURL,
        path: config.url,
      })
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
      
      // baseURL이 없거나 잘못된 경우
      if (!error.config?.baseURL || error.config.baseURL.includes('undefined')) {
        console.error('[API Client] 🔴 Critical: baseURL이 설정되지 않았습니다!')
        console.error('[API Client] NEXT_PUBLIC_API_URL 환경 변수를 확인하세요.')
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
