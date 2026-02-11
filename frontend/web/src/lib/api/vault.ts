import { apiClient } from './client'
import { MEDIA_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../types'

export type CreativeAsset = {
  id: number
  userId: number
  title: string
  description?: string
  assetType: 'LYRIC' | 'COMPOSITION' | 'DEMO_AUDIO' | 'VOCAL_GUIDE' | 'STEMS' | 'AI_GENERATED' | 'AI_ASSISTED'
  fileUrl?: string
  textContent?: string
  contentHash: string
  fileSize?: number
  mimeType?: string
  declaredCreationType?: string
  accessControl: 'PUBLIC' | 'AUDITION_ONLY' | 'PRIVATE'
  registeredAt: string
  createdAt: string
  updatedAt?: string
}

/**
 * ============================================================================
 * 파일 업로드 플로우 문서화 (Phase A - 검증 단계)
 * ============================================================================
 * 
 * [1단계] Frontend: 파일 선택 및 Validation
 *   - 위치: src/app/[locale]/vault/page.tsx (CreateAssetModal)
 *   - 파일 선택: <input type="file"> 사용
 *   - TODO: 파일 크기 제한 검증 추가 필요 (현재 없음)
 *   - TODO: 파일 확장자 제한 검증 추가 필요 (현재 없음)
 *   - TODO: MIME 타입 체크 추가 필요 (현재 없음)
 * 
 * [2단계] Frontend → Media-Service: Upload 요청
 *   - 위치: src/lib/api/vault.ts (createAsset)
 *   - 방법: FormData + multipart/form-data
 *   - 엔드포인트: POST /api/v1/vault/assets
 *   - 인증: Authorization 헤더 필요 (apiClient가 자동 추가)
 *   - 단일 백엔드(NEXT_PUBLIC_API_URL)로 요청
 * 
 * [3단계] Backend: Storage 처리
 *   - 위치: backend (monolith)
 *   - 엔드포인트: CreativeAssetController.createAsset()
 *   - Storage Provider: Local File System (FileStorageService)
 *     - 현재: 로컬 파일 시스템 (./uploads/images, ./uploads/videos)
 *     - 향후: S3 또는 CDN으로 마이그레이션 예정
 *   - 인증: SecurityUtils.getUserIdFromAuthHeaderOrThrow() 사용
 *   - 파일 크기 제한: application.yml에서 50MB 설정
 *   - 확장자 검증: FileStorageService에서 수행
 *     - 이미지: .jpg, .jpeg, .png, .gif, .webp
 *     - 비디오/오디오: .mp4, .mov, .avi, .webm, .mp3, .wav, .flac, .aac, .mid, .midi, .m4a, .ogg
 */
export const vaultApi = {
  // 창작물 자산 등록
  createAsset: async (params: {
    file?: File
    textContent?: string
    title: string
    description?: string
    assetType: string
    declaredCreationType?: string
    accessControl: string
  }): Promise<CreativeAsset> => {
    // TODO: Frontend Validation 추가 필요
    // - 파일 크기 제한: 50MB (media-service와 동일하게)
    // - 파일 확장자 검증: FileStorageService의 허용 목록과 일치
    // - MIME 타입 체크: file.type 검증
    
    const formData = new FormData()
    if (params.file) {
      formData.append('file', params.file)
    }
    if (params.textContent) {
      formData.append('textContent', params.textContent)
    }
    formData.append('title', params.title)
    if (params.description) formData.append('description', params.description)
    formData.append('assetType', params.assetType)
    if (params.declaredCreationType) formData.append('declaredCreationType', params.declaredCreationType)
    formData.append('accessControl', params.accessControl)

    // Gateway 경유: 미설정 (향후 Gateway에 /api/v1/vault/** 라우팅 추가 필요)
    const { data } = await apiClient.post(`${MEDIA_ENDPOINTS.VAULT}/assets`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  // 내 창작물 목록 조회
  getMyAssets: async (params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<CreativeAsset>> => {
    // Gateway 경유: 미설정 (향후 Gateway에 /api/v1/vault/** 라우팅 추가 필요)
    const { data } = await apiClient.get(`${MEDIA_ENDPOINTS.VAULT}/assets/my`, { params })
    return data
  },

  // 창작물 상세 조회
  getAsset: async (id: number): Promise<CreativeAsset> => {
    // Gateway 경유: 미설정 (향후 Gateway에 /api/v1/vault/** 라우팅 추가 필요)
    const { data } = await apiClient.get(`${MEDIA_ENDPOINTS.VAULT}/assets/${id}`)
    return data
  },

  // asset_id 목록으로 조회
  getAssetsByIds: async (assetIds: number[]): Promise<CreativeAsset[]> => {
    // Gateway 경유: 미설정 (향후 Gateway에 /api/v1/vault/** 라우팅 추가 필요)
    const { data } = await apiClient.post(`${MEDIA_ENDPOINTS.VAULT}/assets/batch`, assetIds)
    return data
  },
}
