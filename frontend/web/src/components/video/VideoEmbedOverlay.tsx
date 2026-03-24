'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'

type VideoEmbedOverlayProps = {
  /** 열림: URL 문자열, 닫힘: null */
  videoUrl: string | null
  onClose: () => void
}

/**
 * YouTube 임베드 전용 오버레이: ESC·배경 클릭·스크롤 락·자동재생(모달용)·로딩 표시
 */
export function VideoEmbedOverlay({ videoUrl, onClose }: VideoEmbedOverlayProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const embedSrc = videoUrl ? getVideoEmbedSrc(videoUrl, { autoplay: true }) : null
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    setIframeLoaded(false)
  }, [embedSrc])

  useEffect(() => {
    if (!videoUrl) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [videoUrl])

  useEffect(() => {
    if (!videoUrl) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [videoUrl])

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  if (!videoUrl) return null

  if (!embedSrc) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="영상 재생"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
          onClick={stop}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 text-2xl leading-none text-gray-500 hover:text-gray-800"
            aria-label="닫기"
          >
            ✕
          </button>
          <p className="mb-4 pr-8 text-sm text-gray-700">이 URL은 여기에서 임베드할 수 없습니다.</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white no-underline"
            >
              새 창에서 열기
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="영상 재생"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-3xl" onClick={stop}>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-[2] text-2xl leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] hover:text-gray-200"
            aria-label="닫기"
          >
            ✕
          </button>
          {!iframeLoaded ? (
            <div
              className="absolute inset-0 z-[1] flex items-center justify-center bg-black text-sm text-white/90"
              aria-live="polite"
            >
              영상 불러오는 중…
            </div>
          ) : null}
          <iframe
            title="영상"
            src={embedSrc}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </div>
    </div>
  )
}
