'use client'

import { useId, type ChangeEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { SIGNUP, AUDITION_DETAIL } from '@/lib/design-tokens'
import {
  uploadAuditionImage,
  apiUploadErrorMessage,
  type AuditionUploadDir,
} from '@/lib/api/uploads'
import { AUDITION_IMAGE_ACCEPT_ATTR } from '@/lib/audition/auditionImageRules'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  fontSize: AUDITION_DETAIL.metaMutedPx,
}

type SingleImageUploadFieldProps = {
  label: ReactNode
  /** S3 키 접두사용 dir */
  uploadDir: AuditionUploadDir
  imageUrl: string
  onImageUrlChange: (url: string) => void
  uploading: boolean
  onUploadingChange: (v: boolean) => void
  disabled?: boolean
  helperText?: string
  /** 등록 검증 실패 시 강조 */
  showFieldError?: boolean
}

/** 대표 이미지·기획사 로고 — 파일만 허용, 선택 즉시 uploadAuditionImage → URL 반영 */
export function SingleImageUploadField({
  label,
  uploadDir,
  imageUrl,
  onImageUrlChange,
  uploading,
  onUploadingChange,
  disabled,
  helperText,
  showFieldError,
}: SingleImageUploadFieldProps) {
  const fileInputId = useId()

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    try {
      if (!file) return
      onUploadingChange(true)
      try {
        const url = await uploadAuditionImage(file, uploadDir)
        onImageUrlChange(url)
      } catch (err: unknown) {
        toast.error(apiUploadErrorMessage(err) || '이미지 업로드 실패')
      } finally {
        onUploadingChange(false)
      }
    } finally {
      e.target.value = ''
    }
  }

  const busy = Boolean(disabled || uploading)

  return (
    <div
      style={{
        marginBottom: AUDITION_DETAIL.benefitGridGapPx,
        padding: showFieldError ? 12 : 0,
        marginLeft: showFieldError ? -12 : 0,
        marginRight: showFieldError ? -12 : 0,
        borderRadius: 8,
        border: showFieldError ? '2px solid #ef4444' : '2px solid transparent',
        background: showFieldError ? '#fef2f2' : undefined,
      }}
    >
      <label
        style={{
          display: 'block',
          marginBottom: AUDITION_DETAIL.galleryGapPx,
          fontSize: AUDITION_DETAIL.bodyFontPx,
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {helperText ? (
        <p style={{ marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: 12, color: '#6b7280' }}>{helperText}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={fileInputId}
          type="file"
          accept={AUDITION_IMAGE_ACCEPT_ATTR}
          className="sr-only"
          onChange={onPick}
          disabled={busy}
          aria-label="이미지 파일 선택"
        />
        <label
          htmlFor={fileInputId}
          className="inline-flex items-center justify-center"
          style={{
            height: SIGNUP.inputHeightPx,
            borderRadius: SIGNUP.inputRadiusPx,
            border: `1px solid ${SIGNUP.inputBorderColor}`,
            background: '#fff',
            padding: `0 ${SIGNUP.inputPaddingPx}px`,
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {uploading ? '업로드 중…' : '파일 선택'}
        </label>
        {uploading ? (
          <span className="text-sm text-gray-600" aria-live="polite">
            업로드 중...
          </span>
        ) : null}
        {imageUrl ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onImageUrlChange('')}
            style={{
              fontSize: AUDITION_DETAIL.bodyFontPx,
              color: '#b91c1c',
              background: 'none',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
            }}
          >
            제거
          </button>
        ) : null}
      </div>
      {imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50" style={{ maxWidth: 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-auto max-h-48 w-full object-contain"
            onError={(ev) => {
              const el = ev.currentTarget
              if (el.dataset.fallback === '1') return
              el.dataset.fallback = '1'
              el.onerror = null
              el.src = AUDITION_COVER_PLACEHOLDER_SRC
            }}
          />
        </div>
      ) : null}
      <p style={{ ...inputBaseStyle, marginTop: AUDITION_DETAIL.galleryGapPx, color: '#6b7280' }}>
        JPG·PNG·WebP, 최대 10MB. 대표 이미지 변경: 「이미지 변경」 또는 「제거」 후 다시 선택. 스토리지 공개
        URL만 DB에 저장됩니다.
      </p>
    </div>
  )
}

