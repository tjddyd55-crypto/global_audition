import axios from 'axios'
import { assertAuditionImageFile } from '@/lib/audition/auditionImageRules'
import { apiClient } from '@/lib/api/client'
import { ApiFetchError } from '@/lib/api/apiFetch'

/**
 * 업로드 API `dir` 화이트리스트 — 백엔드 `ImageUploadDirectory`와 동일해야 함.
 * 흐름: 브라우저 → POST 동일 Origin `/api/uploads/image` → Next rewrite → 서버 → R2 → 공개 URL.
 *
 * 금지: R2/스토리지에 직접 PUT·POST, presigned URL로의 직접 업로드(현 단계).
 */
export const AUDITION_UPLOAD_DIRS = ['audition', 'profile', 'thumbnail'] as const
export type AuditionUploadDir = (typeof AUDITION_UPLOAD_DIRS)[number]

const UPLOAD_TIMEOUT_MS = 120_000

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

/**
 * **SSOT**: `apiClient.post('/uploads/image', formData)` → baseURL `/api` → multipart + Bearer.
 */
export async function uploadAuditionImage(file: File, dir: AuditionUploadDir = 'audition'): Promise<string> {
  assertAuditionImageFile(file)
  const formData = new FormData()
  formData.append('file', file)

  try {
    const { data } = await apiClient.post<{ url?: string }>('/uploads/image', formData, {
      params: { dir },
      timeout: UPLOAD_TIMEOUT_MS,
    })
    const url = data?.url != null ? String(data.url).trim() : ''
    if (!url) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[uploadAuditionImage] 응답에 url 없음:', data)
      }
      throw new Error('업로드 응답에 URL이 없습니다.')
    }
    return url
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.code === 'ECONNABORTED') {
        throw new Error('이미지 업로드 시간이 초과되었습니다.')
      }
      const raw = e.response?.data
      let detail = ''
      if (typeof raw === 'string' && raw.trim()) {
        detail = raw.trim()
      } else if (raw && typeof raw === 'object' && 'message' in raw) {
        const m = (raw as { message?: unknown }).message
        if (typeof m === 'string' && m.trim()) detail = m.trim()
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[uploadAuditionImage] 업로드 실패:', e.response?.status, raw)
      }
      throw new Error(detail || e.message || `이미지 업로드 실패 (${e.response?.status ?? '?'})`)
    }
    throw e
  }
}

type UploadErrorBody = {
  message?: string
  error?: string
}

function messageFromUploadErrorBody(data: unknown): string {
  const d = data as UploadErrorBody | undefined
  const msg = d?.message
  return typeof msg === 'string' && msg.trim().length > 0 ? msg.trim() : ''
}

/** 업로드 API 전용 — 401/403·500/503 시 응답 본문 `message` 우선 */
export function apiUploadErrorMessage(e: unknown): string {
  if (e instanceof ApiFetchError) {
    const parsed = tryParseJson(e.bodyText)
    const body = messageFromUploadErrorBody(parsed)
    const status = e.status
    if (status === 401) {
      return body || '업로드 실패: 로그인이 필요합니다. (JWT)'
    }
    if (status === 403) {
      return body || '업로드 실패: 권한이 없습니다. AGENCY/ADMIN 역할 또는 백엔드·스토리지 설정을 확인하세요.'
    }
    if (status === 503) {
      return body || '이미지 업로드 실패'
    }
    if (status === 500) {
      if (body) return body
    }
    if (body) return body
    return e.message
  }
  if (axios.isAxiosError(e)) {
    const status = e.response?.status
    const body = messageFromUploadErrorBody(e.response?.data)
    if (status === 401) {
      return body || '업로드 실패: 로그인이 필요합니다. (JWT)'
    }
    if (status === 403) {
      return body || '업로드 실패: 권한이 없습니다. AGENCY/ADMIN 역할 또는 백엔드·스토리지 설정을 확인하세요.'
    }
    if (status === 503) {
      return body || '이미지 업로드 실패'
    }
    if (status === 500) {
      const m = messageFromUploadErrorBody(e.response?.data)
      if (m) return m
    }
    if (body) return body
  }
  if (e instanceof Error && e.message) {
    return e.message
  }
  return ''
}

export function apiErrorMessage(e: unknown): string {
  if (e instanceof ApiFetchError) {
    const parsed = tryParseJson(e.bodyText)
    const d = parsed as { message?: string; success?: boolean } | undefined
    if (d && typeof d.message === 'string' && d.message.length > 0) {
      return d.message
    }
    if (e.status === 503) {
      return messageFromUploadErrorBody(parsed) || '이미지 업로드 실패'
    }
    if (e.status === 500) {
      const m = messageFromUploadErrorBody(parsed)
      if (m) return m
    }
    if (e.status === 401) {
      return '로그인이 필요합니다.'
    }
    if (e.status === 403) {
      return '접근 권한이 없습니다.'
    }
    return e.message
  }
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { message?: string; success?: boolean } | undefined
    if (d && typeof d.message === 'string' && d.message.length > 0) {
      return d.message
    }
    if (e.response?.status === 503) {
      const m = messageFromUploadErrorBody(e.response?.data)
      return m || '이미지 업로드 실패'
    }
    if (e.response?.status === 500) {
      const m = messageFromUploadErrorBody(e.response?.data)
      if (m) return m
    }
    if (e.response?.status === 401) {
      return '로그인이 필요합니다.'
    }
    if (e.response?.status === 403) {
      return '접근 권한이 없습니다.'
    }
  }
  if (e instanceof Error && e.message) {
    return e.message
  }
  return ''
}
