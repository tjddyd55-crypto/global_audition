import { API_BASE_URL } from '@/lib/env'
import { MEDIA_ENDPOINTS } from './endpoints'

/**
 * Health Check API
 * 
 * Media-Service 및 Gateway의 상태를 확인하는 API
 * GET 요청만 사용하여 안전하게 검증합니다.
 */

export interface HealthStatus {
  status: 'UP' | 'DOWN'
  timestamp?: string
  service?: string
}

/**
 * Media-Service Health Check
 * Gateway를 통해 media-service의 상태를 확인합니다.
 * 실제 존재하는 GET 엔드포인트를 사용하여 안전하게 검증합니다.
 */
export async function checkMediaHealth(): Promise<HealthStatus> {
  try {
    // Gateway를 통해 media-service의 videos API를 호출하여 연결 확인
    // GET 요청만 사용하므로 안전합니다
    // Gateway 경유 가능: USE_GATEWAY.VIDEOS = true
    // 실제 경로: {API_BASE_URL}/api/v1/videos
    const res = await fetch(`${API_BASE_URL}/api/v1${MEDIA_ENDPOINTS.VIDEOS}?page=0&size=1`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`Media service unavailable: ${res.status} ${res.statusText}`)
    }

    // 응답이 정상이면 서비스가 동작 중
    await res.json()
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'media-service',
    }
  } catch (error) {
    console.error('[Health Check] Media service error:', error)
    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      service: 'media-service',
    }
  }
}

/**
 * Gateway Health Check
 * Gateway 자체의 상태를 확인합니다.
 */
export async function checkGatewayHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/actuator/health`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`Gateway unavailable: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    return {
      status: data.status === 'UP' ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      service: 'gateway',
      ...data,
    }
  } catch (error) {
    console.error('[Health Check] Gateway error:', error)
    throw error
  }
}

/**
 * 모든 서비스 Health Check
 */
export async function checkAllServices(): Promise<{
  gateway: HealthStatus
  media: HealthStatus
}> {
  const [gateway, media] = await Promise.allSettled([
    checkGatewayHealth(),
    checkMediaHealth(),
  ])

  return {
    gateway: gateway.status === 'fulfilled' ? gateway.value : { status: 'DOWN', service: 'gateway' },
    media: media.status === 'fulfilled' ? media.value : { status: 'DOWN', service: 'media-service' },
  }
}
