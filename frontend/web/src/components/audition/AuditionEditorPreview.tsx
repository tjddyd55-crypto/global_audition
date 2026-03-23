'use client'

import { useMemo } from 'react'
import type { AuditionStatus } from '@/lib/types/audition'
import { AUDITION_DETAIL, HERO } from '@/lib/design-tokens'
import { EDITOR_LABELS, auditionStatusLabelKo } from '@/lib/audition/auditionEditorCopy'
import { extractYoutubeVideoId } from '@/lib/audition/youtubeEmbed'

/** public 정적 자산 — 깨진 URL 시 onError fallback (무한 루프 방지: 한 번만 교체) */
export const AUDITION_COVER_PLACEHOLDER_SRC = '/audition-cover-placeholder.svg'

export type AuditionEditorPreviewProps = {
  title: string
  description: string
  category: string
  coverImage: string
  videoUrl: string
  status: AuditionStatus
}

export function AuditionEditorPreview({
  title,
  description,
  category,
  coverImage,
  videoUrl,
  status,
}: AuditionEditorPreviewProps) {
  const videoId = useMemo(() => extractYoutubeVideoId(videoUrl), [videoUrl])
  const embedSrc = useMemo(
    () => (videoId ? `https://www.youtube.com/embed/${videoId}` : ''),
    [videoId],
  )

  const displayTitle = useMemo(() => title.trim() || '제목을 입력하세요', [title])
  const displayCategory = useMemo(() => (category.trim() || '기타').trim(), [category])
  const displayDesc = useMemo(
    () => description.trim() || '상세 설명이 여기에 표시됩니다.',
    [description],
  )

  const coverTrimmed = coverImage.trim()

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
                src={coverTrimmed}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const el = e.currentTarget
                  if (el.dataset.fallback === '1') return
                  el.dataset.fallback = '1'
                  el.onerror = null
                  el.src = AUDITION_COVER_PLACEHOLDER_SRC
                }}
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
              <span className="text-xs font-medium text-gray-500">{displayCategory}</span>
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
