'use client'

import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
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
  apiUploadErrorMessage,
  type AuditionUploadDir,
} from '@/lib/api/uploads'
import { AUDITION_IMAGE_ACCEPT_ATTR, assertAuditionImageFile } from '@/lib/audition/auditionImageRules'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

export type ImageUploaderAspect = 'portrait' | 'landscape'

export type ImageUploaderProps = {
  multiple?: boolean
  aspect?: ImageUploaderAspect
  maxCount?: number
  value: string[]
  onChange: (urls: string[]) => void
  /** S3 경로. 미지정 시 단일→covers, 복수→gallery */
  uploadDir?: AuditionUploadDir
  disabled?: boolean
  className?: string
  /** 대표/갤러리 가이드 문구 등 */
  guide?: ReactNode
  label?: ReactNode
  /** 필수 필드 강조(에디터 대표 이미지용) */
  showFieldError?: boolean
}

const DEFAULT_GALLERY_MAX = 10

function aspectFrameClass(aspect: ImageUploaderAspect, forThumb: boolean): string {
  if (aspect === 'portrait') {
    return forThumb ? 'aspect-[3/4] rounded-lg' : 'aspect-[3/4] rounded-lg'
  }
  return forThumb ? 'aspect-video rounded-md' : 'aspect-video rounded-md'
}

function SortableImageCard({
  sortableId,
  url,
  aspect,
  disabled,
  onRemove,
  dragDisabled,
}: {
  sortableId: string
  url: string
  aspect: ImageUploaderAspect
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

  return (
    <div ref={setNodeRef} style={style} className="relative w-[min(100%,280px)] shrink-0">
      <div className={`relative w-full overflow-hidden border border-gray-200 bg-gray-100 ${frame}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
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
            aria-label="순서 변경(드래그)"
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
          aria-label="삭제"
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
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dndId = useId()
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)

  const resolvedMax = maxCountProp ?? (multiple ? DEFAULT_GALLERY_MAX : 1)
  const resolvedUploadDir: AuditionUploadDir = uploadDirProp ?? (multiple ? 'gallery' : 'covers')
  const canAddMore = value.length < resolvedMax
  const busy = disabled || uploadBusy

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
          toast.error(e instanceof Error ? e.message : '이미지 형식이 올바르지 않습니다.')
        }
      }
      if (valid.length === 0) return

      setUploadBusy(true)
      try {
        if (!multiple) {
          const url = await uploadAuditionImage(valid[0], resolvedUploadDir)
          onChange([url])
          return
        }
        let room = resolvedMax - value.length
        if (room <= 0) {
          toast.error(`이미지는 최대 ${resolvedMax}장까지 등록할 수 있습니다.`)
          return
        }
        const slice = valid.slice(0, room)
        if (valid.length > room) {
          toast.message(`최대 ${resolvedMax}장까지만 추가됩니다.`, { description: `${valid.length - room}장은 생략되었습니다.` })
        }
        const next = [...value]
        for (const file of slice) {
          const url = await uploadAuditionImage(file, resolvedUploadDir)
          next.push(url)
        }
        onChange(next)
      } catch (err) {
        toast.error(apiUploadErrorMessage(err) || '이미지 업로드 실패')
      } finally {
        setUploadBusy(false)
      }
    },
    [multiple, onChange, resolvedMax, resolvedUploadDir, value]
  )

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    e.target.value = ''
    if (!list?.length) return
    await validateAndUploadFiles(Array.from(list))
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
    if (busy || !canAddMore) return
    const dt = e.dataTransfer.files
    if (!dt?.length) return
    await validateAndUploadFiles(Array.from(dt))
  }

  const framePreview = aspectFrameClass(aspect, false)
  const dropZoneClass =
    'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors cursor-pointer select-none'
  const dropActive = isDraggingFile ? 'border-violet-500 bg-violet-50/50' : 'hover:border-gray-400 bg-gray-50/40'

  const openFilePicker = () => {
    if (!busy && canAddMore) inputRef.current?.click()
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
        ref={inputRef}
        type="file"
        accept={AUDITION_IMAGE_ACCEPT_ATTR}
        multiple={multiple && canAddMore}
        className="hidden"
        onChange={onInputChange}
        disabled={busy}
      />

      {!multiple && (
        <button
          type="button"
          disabled={busy || !canAddMore}
          onClick={openFilePicker}
          onDragEnter={(e) => {
            e.preventDefault()
            if (!busy && canAddMore) setIsDraggingFile(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingFile(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`${dropZoneClass} ${dropActive} mb-4 w-full max-w-md disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <div className={`relative mx-auto mb-3 w-full max-w-[220px] overflow-hidden bg-gray-100 ${framePreview}`}>
            {uploadBusy ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">업로드 중…</div>
            ) : value[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value[0]}
                alt=""
                className="h-full w-full object-cover"
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
                <span>이미지를 드래그하거나</span>
                <span className="font-medium text-violet-600">클릭하여 선택</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">JPG · PNG · WebP, 최대 5MB</p>
        </button>
      )}

      {multiple && value.length === 0 && (
        <button
          type="button"
          disabled={busy || !canAddMore}
          onClick={openFilePicker}
          onDragEnter={(e) => {
            e.preventDefault()
            if (!busy && canAddMore) setIsDraggingFile(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingFile(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`${dropZoneClass} ${dropActive} mb-4 w-full disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <div className={`relative mx-auto mb-3 w-full max-w-[320px] overflow-hidden bg-gray-100 ${framePreview}`}>
            {uploadBusy ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">업로드 중…</div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-gray-400">
                <span>갤러리 이미지를 드래그하거나</span>
                <span className="font-medium text-violet-600">클릭하여 선택 (여러 장)</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">JPG · PNG · WebP, 각 최대 5MB · 최대 {resolvedMax}장</p>
        </button>
      )}

      {multiple && value.length > 0 ? (
        <div
          className={`${dropZoneClass} ${dropActive} mb-4`}
          onDragEnter={(e) => {
            e.preventDefault()
            if (!busy && canAddMore) setIsDraggingFile(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingFile(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <button
            type="button"
            disabled={busy || !canAddMore}
            onClick={openFilePicker}
            className="text-sm font-medium text-violet-700 underline disabled:text-gray-400"
          >
            {uploadBusy ? '업로드 중…' : canAddMore ? '이미지 더 추가 (클릭 또는 드래그)' : `최대 ${resolvedMax}장까지 등록됨`}
          </button>
          <p className="mt-2 text-xs text-gray-500">순서: 좌하단 ⋮⋮ 핸들을 드래그 · 우상단 × 삭제</p>
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
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={openFilePicker}
            className="text-sm font-medium text-violet-700 underline disabled:opacity-50"
          >
            이미지 변경
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange([])}
            className="text-sm font-medium text-red-600 underline disabled:opacity-50"
          >
            제거
          </button>
        </div>
      ) : null}
    </div>
  )
}
