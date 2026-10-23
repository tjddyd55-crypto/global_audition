'use client'

import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import {
  uploadAuditionImage,
  uploadAuditionImageWithVariants,
  type AuditionUploadDir,
} from '@/shared/api/uploads'
import { useTranslations } from 'next-intl'
import {
  AUDITION_IMAGE_ACCEPT_ATTR,
  AUDITION_IMAGE_MAX_BYTES,
  assertAuditionImageFile,
} from '@/shared/audition/auditionImageRules'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'
import { bindCatalogTranslator, mapDisplayError } from '@/shared/i18n/mapDisplayError'

export type ImageUploaderAspect = 'portrait' | 'landscape'

export type ImageUploaderProps = {
  multiple?: boolean
  aspect?: ImageUploaderAspect
  maxCount?: number
  value: string[]
  onChange: (urls: string[]) => void
  /** R2 키 접두사용 dir. 미지정 시 단일→audition, 복수→thumbnail */
  uploadDir?: AuditionUploadDir
  disabled?: boolean
  className?: string
  /** 대표/갤러리 가이드 문구 등 */
  guide?: ReactNode
  label?: ReactNode
  /** 필수 필드 강조(에디터 대표 이미지용) */
  showFieldError?: boolean
  /**
   * 단일(대표) 슬롯 + `multiple===false` 일 때만 사용.
   * 지정 시 업로드 응답의 original/medium/thumb 를 받고, 미리보기용 `onChange`에는 medium URL을 넘김.
   */
  onAuditionCoverUrls?: (urls: { original: string; medium: string; thumb: string }) => void
}

const DEFAULT_GALLERY_MAX = 10

function aspectFrameClass(aspect: ImageUploaderAspect, forThumb: boolean): string {
  if (aspect === 'portrait') {
    return forThumb ? 'aspect-[3/4] rounded-lg' : 'aspect-[3/4] rounded-lg'
  }
  return forThumb ? 'aspect-[16/9] rounded-md' : 'aspect-[16/9] rounded-md'
}

function previewObjectFitClass(aspect: ImageUploaderAspect): string {
  return aspect === 'landscape' ? 'object-contain' : 'object-cover'
}

function SortableImageCard({
  sortableId,
  url,
  aspect,
  objectFitClass,
  disabled,
  onRemove,
  dragDisabled,
}: {
  sortableId: string
  url: string
  aspect: ImageUploaderAspect
  objectFitClass: string
  disabled: boolean
  onRemove: () => void
  dragDisabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    disabled: disabled || dragDisabled,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }
  const frame = aspectFrameClass(aspect, true)
  const tUploader = useTranslations('uploader')
  const tCommon = useTranslations('common')

  return (
    <div ref={setNodeRef} style={style} className="relative w-[min(100%,280px)] shrink-0">
      <div className={`relative w-full overflow-hidden border border-gray-200 bg-gray-100 ${frame}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className={`h-full w-full ${objectFitClass}`}
          onError={(ev) => {
            const el = ev.currentTarget
            if (el.dataset.fallback === '1') return
            el.dataset.fallback = '1'
            el.onerror = null
            el.src = AUDITION_COVER_PLACEHOLDER_SRC
          }}
        />
        {!dragDisabled && !disabled ? (
          <button
            type="button"
            className="absolute bottom-2 left-2 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-md bg-black/50 text-xs text-white active:cursor-grabbing"
            aria-label={tUploader('reorderAria')}
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-sm font-bold text-white shadow disabled:opacity-40"
          aria-label={tCommon('delete')}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export function ImageUploader({
  multiple = false,
  aspect = 'portrait',
  maxCount: maxCountProp,
  value,
  onChange,
  uploadDir: uploadDirProp,
  disabled = false,
  className = '',
  guide,
  label,
  showFieldError,
  onAuditionCoverUrls,
}: ImageUploaderProps) {
  const tUploader = useTranslations('uploader')
  const tChannel = useTranslations('channel')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const translateError = bindCatalogTranslator({ uploader: tUploader, errors: tErrors })
  const fileInputId = useId()
  const dndId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)

  const resolvedMax = maxCountProp ?? (multiple ? DEFAULT_GALLERY_MAX : 1)
  const resolvedUploadDir: AuditionUploadDir = uploadDirProp ?? (multiple ? 'thumbnail' : 'audition')
  /** 갤러리만 슬롯 상한 적용. 단일(대표)은 이미지가 있어도 교체 가능해야 함 */
  const galleryFull = multiple && value.length >= resolvedMax
  const inputDisabled = disabled || uploadBusy || galleryFull
  const busy = disabled || uploadBusy

  const coverPreviewFit = previewObjectFitClass(aspect)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const removeAt = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [onChange, value]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = Number.parseInt(String(active.id), 10)
      const newIndex = Number.parseInt(String(over.id), 10)
      if (!Number.isFinite(oldIndex) || !Number.isFinite(newIndex) || oldIndex === newIndex) return
      if (oldIndex < 0 || newIndex < 0 || oldIndex >= value.length || newIndex >= value.length) return
      onChange(arrayMove(value, oldIndex, newIndex))
    },
    [onChange, value]
  )

  const validateAndUploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      const valid: File[] = []
      for (const f of files) {
        try {
          assertAuditionImageFile(f)
          valid.push(f)
        } catch (e) {
          toast.error(mapDisplayError(e, translateError, tUploader('invalidType')))
        }
      }
      if (valid.length === 0) return

      setUploadBusy(true)
      try {
        if (!multiple) {
          if (onAuditionCoverUrls) {
            const urls = await uploadAuditionImageWithVariants(valid[0], resolvedUploadDir)
            onAuditionCoverUrls(urls)
            onChange([urls.medium])
            return
          }
          const url = await uploadAuditionImage(valid[0], resolvedUploadDir)
          onChange([url])
          return
        }
        let room = resolvedMax - value.length
        if (room <= 0) {
          toast.error(tUploader('maxCount', { n: resolvedMax }))
          return
        }
        const slice = valid.slice(0, room)
        if (valid.length > room) {
          toast.message(tUploader('maxAdded', { n: resolvedMax }), {
            description: tUploader('omitted', { n: valid.length - room }),
          })
        }
        const next = [...value]
        for (const file of slice) {
          const url = await uploadAuditionImage(file, resolvedUploadDir)
          next.push(url)
        }
        onChange(next)
      } catch (err) {
        toast.error(mapDisplayError(err, translateError, tUploader('uploadFailed')))
      } finally {
        setUploadBusy(false)
      }
    },
    [multiple, onAuditionCoverUrls, onChange, resolvedMax, resolvedUploadDir, tUploader, translateError, value]
  )

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    try {
      if (!list?.length) return
      await validateAndUploadFiles(Array.from(list))
    } finally {
      e.target.value = ''
    }
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
    if (busy) return
    if (multiple && value.length >= resolvedMax) return
    const dt = e.dataTransfer.files
    if (!dt?.length) return
    await validateAndUploadFiles(Array.from(dt))
  }

  const framePreview = aspectFrameClass(aspect, false)
  const dropZoneClass =
    'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors cursor-pointer select-none'
  const dropActive = isDraggingFile ? 'border-violet-500 bg-violet-50/50' : 'hover:border-gray-400 bg-gray-50/40'

  const dropZoneDisabledClass = inputDisabled ? 'cursor-not-allowed opacity-60 pointer-events-none' : ''

  const openFilePicker = useCallback(() => {
    if (inputDisabled) return
    fileInputRef.current?.click()
  }, [inputDisabled])

  const onDropZoneKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openFilePicker()
    }
  }

  return (
    <div
      className={className}
      style={
        showFieldError
          ? {
              padding: 12,
              marginLeft: -12,
              marginRight: -12,
              borderRadius: 8,
              border: '2px solid #ef4444',
              background: '#fef2f2',
            }
          : undefined
      }
    >
      {label ? (
        <div className="mb-2 block text-sm font-semibold text-gray-900">{label}</div>
      ) : null}
      {guide ? <div className="mb-3 text-xs leading-relaxed text-gray-600">{guide}</div> : null}

      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept={AUDITION_IMAGE_ACCEPT_ATTR}
        multiple={multiple && !galleryFull}
        className="sr-only"
        onChange={onInputChange}
        disabled={inputDisabled}
        aria-label={tUploader('pickFileAria')}
      />

      {!multiple && (
        <div
          role="button"
          tabIndex={inputDisabled ? -1 : 0}
          aria-disabled={inputDisabled}
          aria-label={tUploader('dropAria')}
          className={`${dropZoneClass} ${dropActive} mb-4 w-full max-w-md ${dropZoneDisabledClass}`}
          onClick={openFilePicker}
          onKeyDown={onDropZoneKeyDown}
          onDragEnter={(e) => {
            e.preventDefault()
            if (!inputDisabled) setIsDraggingFile(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingFile(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className={`relative mx-auto mb-3 w-full max-w-[220px] overflow-hidden bg-gray-100 ${framePreview}`}>
            {uploadBusy ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">{tChannel('uploading')}</div>
            ) : value[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value[0]}
                alt=""
                className={`h-full w-full ${coverPreviewFit}`}
                onError={(ev) => {
                  const el = ev.currentTarget
                  if (el.dataset.fallback === '1') return
                  el.dataset.fallback = '1'
                  el.onerror = null
                  el.src = AUDITION_COVER_PLACEHOLDER_SRC
                }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-gray-400">
                <span>{tUploader('dragOr')}</span>
                <span className="font-medium text-violet-600">{tUploader('clickToSelect')}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {tUploader('formatsMax', { n: Math.round(AUDITION_IMAGE_MAX_BYTES / (1024 * 1024)) })}
          </p>
        </div>
      )}

      {uploadBusy ? (
        <p className="mt-2 text-sm text-gray-500" aria-live="polite">
          {tChannel('uploading')}
        </p>
      ) : null}

      {multiple && value.length === 0 && (
        <div
          role="button"
          tabIndex={inputDisabled ? -1 : 0}
          aria-disabled={inputDisabled}
          aria-label={tUploader('galleryDropAria')}
          className={`${dropZoneClass} ${dropActive} mb-4 w-full ${dropZoneDisabledClass}`}
          onClick={openFilePicker}
          onKeyDown={onDropZoneKeyDown}
          onDragEnter={(e) => {
            e.preventDefault()
            if (!inputDisabled) setIsDraggingFile(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingFile(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className={`relative mx-auto mb-3 w-full max-w-[320px] overflow-hidden bg-gray-100 ${framePreview}`}>
            {uploadBusy ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">{tChannel('uploading')}</div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-gray-400">
                <span>{tUploader('galleryDragOr')}</span>
                <span className="font-medium text-violet-600">{tUploader('clickMultiple')}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {tUploader('formatsMaxEach', {
              n: Math.round(AUDITION_IMAGE_MAX_BYTES / (1024 * 1024)),
              max: resolvedMax,
            })}
          </p>
        </div>
      )}

      {multiple && value.length > 0 ? (
        <div
          className={`${dropZoneClass} ${dropActive} mb-4`}
          onDragEnter={(e) => {
            e.preventDefault()
            if (!busy && !galleryFull) setIsDraggingFile(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingFile(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          {galleryFull || inputDisabled ? (
            <span className="text-sm font-medium text-gray-400">
              {uploadBusy ? tChannel('uploading') : tUploader('registeredMax', { n: resolvedMax })}
            </span>
          ) : (
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-violet-700 underline"
              onClick={openFilePicker}
            >
              {uploadBusy ? tChannel('uploading') : tUploader('addMore')}
            </button>
          )}
          <p className="mt-2 text-xs text-gray-500">{tUploader('reorderHint')}</p>
        </div>
      ) : null}

      {multiple && value.length > 0 ? (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.map((_, i) => String(i))} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-4">
              {value.map((url, index) => (
                <SortableImageCard
                  key={`slot-${index}-${url.slice(0, 48)}`}
                  sortableId={String(index)}
                  url={url}
                  aspect={aspect}
                  objectFitClass={previewObjectFitClass(aspect)}
                  disabled={busy}
                  dragDisabled={value.length < 2}
                  onRemove={() => removeAt(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      {!multiple && value[0] ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {inputDisabled ? (
            <span className="text-sm font-medium text-gray-400">{tUploader('changeImage')}</span>
          ) : (
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-violet-700 underline"
              onClick={openFilePicker}
            >
              {tUploader('changeImage')}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange([])}
            className="text-sm font-medium text-red-600 underline disabled:opacity-50"
          >
            {tCommon('remove')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
