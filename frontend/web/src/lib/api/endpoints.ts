/**
 * ============================================================================
 * API 엔드포인트 상수화
 * ============================================================================
 *
 * API는 `apiClient`(base `/api`) 또는 `apiFetch` 로 동일 Origin 호출.
 *
 * 사용법:
 * import { MEDIA_ENDPOINTS, MEDIA_API_BASE } from '@/lib/api/endpoints'
 */

/**
 * Media API path prefix (게이트웨이 전환 시 Next에서 `/media` rewrite 추가 가능)
 */
export const MEDIA_API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_GATEWAY === 'true' ? '/media' : ''

/**
 * Media-Service API 엔드포인트 (상대 경로)
 * 
 * 주의: apiClient의 baseURL이 이미 '/api/v1'로 설정되어 있으므로,
 * 여기서는 '/api/v1' 이후의 경로만 정의합니다.
 * 
 * 현재 상태:
 * - Gateway 라우팅: /api/v1/videos/** 만 설정됨
 * - Gateway 미설정: /api/v1/vault/**, /api/v1/media/**
 * 
 * 향후 전환:
 * - 모든 엔드포인트를 Gateway를 통해 접근하도록 변경 가능
 * - 이 상수만 수정하면 전체 경로 변경 가능
 */
export const MEDIA_ENDPOINTS = {
  /**
   * Videos API
   * Gateway 라우팅: /api/v1/videos/** (설정됨)
   * Media-Service: VideoContentController
   * 실제 경로: /api/videos
   */
  VIDEOS: '/videos',
  
  /**
   * Vault (Creative Assets) API
   * Gateway 라우팅: 미설정 (향후 추가 필요)
   * Media-Service: CreativeAssetController
   * 실제 경로: /api/vault
   */
  VAULT: '/vault',
  
  /**
   * Media Upload API
   * Gateway 라우팅: 미설정 (향후 추가 필요)
   * Media-Service: MediaController
   * 실제 경로: /api/media
   */
  MEDIA: '/media',
  
  /**
   * Video Comments API
   * Gateway 라우팅: 미설정 (향후 추가 필요)
   * Media-Service: VideoCommentController
   * 실제 경로: /api/videos/{videoId}/comments
   */
  VIDEO_COMMENTS: '/videos',
  
  /**
   * Video Search API
   * Gateway 라우팅: 미설정 (향후 추가 필요)
   * Media-Service: VideoSearchController
   * 실제 경로: /api/search/videos
   */
  VIDEO_SEARCH: '/search/videos',
  
  /**
   * Video Ranking API
   * Gateway 라우팅: 미설정 (향후 추가 필요)
   * Media-Service: VideoRankingController
   * 실제 경로: /api/videos/ranking
   */
  VIDEO_RANKING: '/videos/ranking',
  
  /**
   * Video Feedback API
   * Gateway 라우팅: 미설정 (향후 추가 필요)
   * Media-Service: VideoFeedbackController
   * 실제 경로: /api/videos/feedback
   */
  VIDEO_FEEDBACK: '/videos/feedback',
  
  /**
   * Creator Analytics API
   * Gateway 라우팅: 미설정 (향후 추가 필요)
   * Media-Service: CreatorAnalyticsController
   * 실제 경로: /api/analytics/creator
   */
  CREATOR_ANALYTICS: '/analytics/creator',
} as const

/**
 * Gateway 전환 가능 여부
 * 
 * 현재:
 * - VIDEOS: Gateway 경유 가능 (라우팅 설정됨)
 * - VAULT, MEDIA 등: Gateway 경유 불가 (라우팅 미설정)
 * 
 * 향후:
 * - Gateway에 모든 media-service 경로 추가 후
 * - 이 상수만 수정하여 Gateway 경유로 전환 가능
 */
export const USE_GATEWAY = {
  VIDEOS: true,      // Gateway 라우팅 설정됨
  VAULT: false,      // Gateway 라우팅 미설정
  MEDIA: false,      // Gateway 라우팅 미설정
  COMMENTS: false,   // Gateway 라우팅 미설정
  SEARCH: false,     // Gateway 라우팅 미설정
  RANKING: false,    // Gateway 라우팅 미설정
  FEEDBACK: false,   // Gateway 라우팅 미설정
  ANALYTICS: false,  // Gateway 라우팅 미설정
} as const
