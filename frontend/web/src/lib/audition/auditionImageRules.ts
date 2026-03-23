/**
 * 오디션 에디터·업로드 API와 동일한 제한 (프론트 선검증)
 */
export const AUDITION_IMAGE_MAX_BYTES = 5 * 1024 * 1024

/** S3 PutObject 등에 맞춘 정규 MIME */
export type AuditionAllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export function normalizeAuditionImageMime(file: File): AuditionAllowedImageMime | null {
  const t = (file.type ?? '').toLowerCase().trim()
  if (t === 'image/jpeg' || t === 'image/jpg' || t === 'image/pjpeg') return 'image/jpeg'
  if (t === 'image/png') return 'image/png'
  if (t === 'image/webp') return 'image/webp'
  return null
}

export function assertAuditionImageFile(file: File): void {
  if (file.size > AUDITION_IMAGE_MAX_BYTES) {
    throw new Error('파일 크기는 5MB 이하여야 합니다.')
  }
  if (!normalizeAuditionImageMime(file)) {
    throw new Error('JPG, PNG, WebP만 업로드할 수 있습니다.')
  }
}

export const AUDITION_IMAGE_ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
