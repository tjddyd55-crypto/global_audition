import axios from 'axios'
import { apiClient } from './client'
import { assertAuditionImageFile } from '@/lib/audition/auditionImageRules'

/**
 * 오디션 에디터 이미지 업로드 전용 `dir` — 백엔드 S3 키 접두사와 1:1
 * - covers → auditions/covers/
 * - gallery → auditions/gallery/
 * - agency_logo → agencies/logos/
 */
export const AUDITION_UPLOAD_DIRS = ['covers', 'gallery', 'agency_logo'] as const
export type AuditionUploadDir = (typeof AUDITION_UPLOAD_DIRS)[number]

/**
 * **SSOT**: 모든 이미지 업로드는 이 함수만 사용 (apiClient → Bearer JWT + withCredentials).
 * `fetch` 직접 호출 금지 — 401·CORS 이슈 방지.
 */
export async function uploadAuditionImage(file: File, dir: AuditionUploadDir = 'covers'): Promise<string> {
  assertAuditionImageFile(file)
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<{ url: string }>('/uploads/image', form, {
    params: { dir },
    timeout: 120_000,
  })
  const url = data?.url != null ? String(data.url).trim() : ''
  if (!url) {
    throw new Error('업로드 응답에 URL이 없습니다.')
  }
  return url
}

/** 업로드 API 전용 — 401/403 안내 포함 */
export function apiUploadErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status
    const d = e.response?.data as { message?: string } | undefined
    const body = typeof d?.message === 'string' && d.message.length > 0 ? d.message : ''
    if (status === 401) {
      return body || '업로드 실패: 로그인이 필요합니다. (JWT)'
    }
    if (status === 403) {
      return body || '업로드 실패: 권한이 없습니다. AGENCY/ADMIN 역할 또는 S3 IAM 정책을 확인하세요.'
    }
    if (status === 503) {
      return body || '이미지 업로드 서버가 구성되지 않았습니다. 관리자에게 문의하세요.'
    }
    if (body) return body
  }
  if (e instanceof Error && e.message) {
    return e.message
  }
  return ''
}

export function apiErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { message?: string; success?: boolean } | undefined
    if (d && typeof d.message === 'string' && d.message.length > 0) {
      return d.message
    }
    if (e.response?.status === 503) {
      return '이미지 업로드 서버가 구성되지 않았습니다. 관리자에게 문의하세요.'
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
