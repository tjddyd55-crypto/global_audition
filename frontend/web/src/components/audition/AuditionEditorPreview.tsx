'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuditionStatus } from '@/shared/types/audition'
import { AUDITION_DETAIL, HERO } from '@/shared/design-tokens'
import { EDITOR_LABELS, auditionStatusLabelKo } from '@/shared/audition/auditionEditorCopy'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'

/** public 정적 자산 — 깨진 URL 시 onError fallback (무한 루프 방지: 한 번만 교체) */
export const AUDITION_COVER_PLACEHOLDER_SRC = '/audition-cover-placeholder.svg'

export type AuditionEditorPreviewProps = {
  title: string
  description: string
  tags: string[]
  /** 리스트 카드와 동일 규칙: thumb (폴백은 폼에서 이미 채움) */
  coverThumbUrl: string
  videoUrl: string
  status: AuditionStatus
}

export function AuditionEditorPreview({
  title,
  description,
  tags,
  coverThumbUrl,
  videoUrl,
  status,
}: AuditionEditorPreviewProps) {
  const embedSrc = useMemo(() => getVideoEmbedSrc(videoUrl) ?? '', [videoUrl])

  const displayTitle = useMemo(() => title.trim() || '제목을 입력하세요', [title])
  const displayTags = useMemo(() => tags.map((t) => t.trim()).filter(Boolean), [tags])
  const displayDesc = useMemo(
    () => description.trim() || '상세 설명이 여기에 표시됩니다.',
    [description],
  )

  const coverTrimmed = coverThumbUrl.trim()
  const [coverFailed, setCoverFailed] = useState(false)

  useEffect(() => {
    setCoverFailed(false)
  }, [coverTrimmed])

  const coverPreviewSrc = !coverTrimmed || coverFailed ? AUDITION_COVER_PLACEHOLDER_SRC : coverTrimmed

  const onCoverPreviewError = useCallback(() => {
    setCoverFailed(true)
  }, [])

  return (
    <aside
      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      style={{ borderColor: AUDITION_DETAIL.cardBorderColor }}
    >
      <div
        className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800"
        style={{ borderColor: AUDITION_DETAIL.cardBorderColor }}
      >
        {EDITOR_LABELS.previewTitle}
      </div>
      <p className="px-4 pt-2 text-xs text-gray-500 leading-snug">{EDITOR_LABELS.previewHint}</p>

      <div className="p-4">
        <div
          className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
          style={{ borderColor: AUDITION_DETAIL.cardBorderColor }}
        >
          <div className="relative aspect-[3/4] w-full max-w-xs mx-auto bg-gray-200 rounded-lg overflow-hidden">
            {coverTrimmed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreviewSrc}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={onCoverPreviewError}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                대표 이미지를 업로드하면 여기에 표시됩니다
              </div>
            )}
          </div>

          <div className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  background:
                    status === 'OPEN'
                      ? `linear-gradient(90deg, ${HERO.primaryGradientStart}22, ${HERO.primaryGradientEnd}22)`
                      : '#f3f4f6',
                  color: status === 'OPEN' ? HERO.primaryGradientStart : '#4b5563',
                }}
              >
                {auditionStatusLabelKo(status)}
              </span>
              {displayTags.length > 0
                ? displayTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))
                : null}
            </div>

            <h2 className="text-lg font-bold text-gray-900 leading-tight">{displayTitle}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">{displayDesc}</p>

            {embedSrc ? (
              <div className="pt-2">
                <p className="mb-1 text-xs font-medium text-gray-500">영상 미리보기</p>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <iframe
                    key={embedSrc}
                    title="YouTube 미리보기"
                    className="absolute inset-0 h-full w-full"
                    src={embedSrc}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}
