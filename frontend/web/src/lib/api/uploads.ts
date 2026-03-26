import axios from 'axios'
import { assertAuditionImageFile } from '@/lib/audition/auditionImageRules'
import { apiFetch, ApiFetchError } from '@/lib/api/apiFetch'

/**
 * 오디션 에디터 이미지 업로드 전용 `dir` — 백엔드가 생성하는 객체 키 접두사와 1:1.
 * 흐름: 브라우저 → POST `/api/uploads/image` → 서버 → R2(PutObject) → 공개 URL 반환.
 *
 * 금지: R2/스토리지에 직접 PUT·POST, presigned URL로의 직접 업로드(현 단계).
 */
export const AUDITION_UPLOAD_DIRS = ['covers', 'gallery', 'agency_logo'] as const
export type AuditionUploadDir = (typeof AUDITION_UPLOAD_DIRS)[number]

const UPLOAD_TIMEOUT_MS = 120_000

function uploadsImagePath(dir: AuditionUploadDir): string {
  const q = new URLSearchParams({ dir })
  return `/uploads/image?${q.toString()}`
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

/**
 * **SSOT**: 모든 이미지 업로드는 이 함수만 사용 (`apiFetch` → Bearer + credentials, FormData boundary 유지).
 * 백엔드 API 외 경로로 스토리지에 올리지 않는다.
 */
export async function uploadAuditionImage(file: File, dir: AuditionUploadDir = 'covers'): Promise<string> {
  assertAuditionImageFile(file)
  const form = new FormData()
  form.append('file', file)

  const path = uploadsImagePath(dir)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)
  let res: Response
  try {
    res = await apiFetch(path, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('이미지 업로드 시간이 초과되었습니다.')
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }

  const text = await res.text()
  if (!res.ok) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[uploadAuditionImage] 업로드 실패:', res.status, text)
    }
    let msg = ''
    const parsed = tryParseJson(text)
    if (parsed && typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
      const m = (parsed as { message?: unknown }).message
      if (typeof m === 'string' && m.trim()) msg = m.trim()
    }
    throw new Error(msg || text || `이미지 업로드 실패 (${res.status})`)
  }

  const data = tryParseJson(text) as { url?: unknown } | undefined
  const url = data?.url != null ? String(data.url).trim() : ''
  if (!url) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[uploadAuditionImage] 응답에 url 없음:', text)
    }
    throw new Error('업로드 응답에 URL이 없습니다.')
  }
  return url
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
