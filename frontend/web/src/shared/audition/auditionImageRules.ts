/**
 * 오디션 에디터·업로드 API와 동일한 제한 (프론트 선검증).
 * 백엔드 `app.upload.max-image-bytes`·`spring.servlet.multipart.max-file-size`와 맞출 것.
 */
export const AUDITION_IMAGE_MAX_BYTES = 10 * 1024 * 1024

/** S3 PutObject 등에 맞춘 정규 MIME */
export type AuditionAllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export function normalizeAuditionImageMime(file: File): AuditionAllowedImageMime | null {
  const t = (file.type ?? '').toLowerCase().trim()
  if (t === 'image/jpeg' || t === 'image/jpg' || t === 'image/pjpeg') return 'image/jpeg'
  if (t === 'image/png') return 'image/png'
  if (t === 'image/webp') return 'image/webp'
  return null
}

export const AUDITION_IMAGE_ERROR = {
  TOO_LARGE: 'IMAGE_FILE_TOO_LARGE',
  INVALID_TYPE: 'IMAGE_FILE_INVALID_TYPE',
} as const

export function assertAuditionImageFile(file: File): void {
  if (file.size > AUDITION_IMAGE_MAX_BYTES) {
    throw new Error(AUDITION_IMAGE_ERROR.TOO_LARGE)
  }
  if (!normalizeAuditionImageMime(file)) {
    throw new Error(AUDITION_IMAGE_ERROR.INVALID_TYPE)
  }
}

export const AUDITION_IMAGE_ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
