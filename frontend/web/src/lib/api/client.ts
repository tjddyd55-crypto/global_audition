import axios from 'axios'

// Railway Gateway URL (프로덕션)
// Railway frontend-web 서비스에서 NEXT_PUBLIC_API_URL 환경 변수로 설정 필요
// Railway → frontend-web → Variables → NEXT_PUBLIC_API_URL=https://gateway-production-72d6.up.railway.app
const getApiBaseUrl = (): string => {
  // Next.js 빌드 타임에 환경 변수가 하드코딩됨
  // Railway에서 NEXT_PUBLIC_API_URL 환경 변수를 설정해야 함
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (envUrl) {
    // 환경 변수가 설정된 경우
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
      console.log('[API Client] Using NEXT_PUBLIC_API_URL:', envUrl)
    }
    return envUrl
  }
  
  // 기본값: Gateway URL (프로덕션)
  const defaultUrl = 'https://gateway-production-72d6.up.railway.app'
  console.warn('[API Client] ⚠️ NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.')
  console.warn('[API Client] Railway → frontend-web → Variables에서 NEXT_PUBLIC_API_URL을 설정해주세요.')
  console.warn('[API Client] 기본값 사용:', defaultUrl)
  return defaultUrl
}

const API_BASE_URL = getApiBaseUrl()

// 최종 baseURL 로깅 (개발 모드 및 디버깅용)
// 프로덕션에서는 next.config.js의 removeConsole로 제거되지만,
// 중요한 정보이므로 개발 모드에서는 항상 출력
if (typeof window !== 'undefined') {
  const fullApiUrl = `${API_BASE_URL}/api/v1`
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Client] ✅ API Base URL:', fullApiUrl)
  }
  // 프로덕션에서도 중요한 에러는 출력 (removeConsole이 적용되지 않음)
  if (!API_BASE_URL || API_BASE_URL.includes('localhost')) {
    console.error('[API Client] ❌ 잘못된 API URL:', API_BASE_URL)
  }
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 (인증 토큰 추가 및 디버깅)
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 요청 URL 로깅 (디버깅용)
    const fullUrl = config.baseURL + config.url
    if (typeof window !== 'undefined') {
      console.log('[API Client] → Request:', {
        method: config.method?.toUpperCase(),
        url: fullUrl,
        baseURL: config.baseURL,
        path: config.url,
      })
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 에러 상세 로깅 (항상)
    const fullUrl = error.config?.baseURL + error.config?.url
    console.error('[API Client] Request Error:', {
      fullUrl,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    })
    
    // 네트워크 에러 (서버에 도달하지 못함)
    if (!error.response) {
      console.error('[API Client] Network Error - 요청이 서버에 도달하지 못했습니다:', {
        url: fullUrl,
        message: error.message,
        code: error.code,
      })
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
