'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { getVideoEmbedSrc, isYoutubeShortsLikeUrl } from '@/shared/utils/videoEmbed'

/** 플레이리스트·추천 영상 등 확장용 — url 필수, 나머지 선택 */
export type VideoEmbedPlayPayload = {
  url: string
  title?: string
  thumbnail?: string
  /** 이전 트랙 (플레이리스트·추천 영상 전환) */
  prev?: () => void
  /** 다음 트랙 */
  next?: () => void
}

export type VideoEmbedOverlayProps = {
  onClose: () => void
  /** 하위 호환: 단일 URL */
  videoUrl?: string | null
  /** 확장: 제목·썸네일·추후 메타 */
  play?: VideoEmbedPlayPayload | null
}

const IFRAME_ALLOW =
  'autoplay; encrypted-media; picture-in-picture; accelerometer; clipboard-write; gyroscope; fullscreen'

const OVERLAY_Z =
  'fixed inset-0 z-[9999] flex items-center justify-center bg-black p-0 transition-opacity duration-200 ease-out'

function resolvePlay(
  play: VideoEmbedPlayPayload | null | undefined,
  videoUrl: string | null | undefined
): VideoEmbedPlayPayload | null {
  if (play != null && typeof play === 'object' && play.url?.trim()) {
    return { ...play, url: play.url.trim() }
  }
  if (videoUrl?.trim()) return { url: videoUrl.trim() }
  return null
}

function collectFocusables(root: HTMLElement): HTMLElement[] {
  const sel = 'button:not([disabled]), a[href], iframe'
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => {
    const style = window.getComputedStyle(el)
    return style.visibility !== 'hidden' && style.display !== 'none'
  })
}

function trapTab(e: React.KeyboardEvent<HTMLDivElement>, root: HTMLElement | null) {
  if (e.key !== 'Tab' || !root) return
  const nodes = collectFocusables(root)
  if (nodes.length === 0) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (e.shiftKey) {
    if (active === first || active === root) {
      e.preventDefault()
      last.focus()
    }
  } else if (active === last) {
    e.preventDefault()
    first.focus()
  }
}

/**
 * YouTube 임베드 전용 오버레이: ESC·배경 클릭·스크롤 락·자동재생(모달용)·로딩 표시
 * (종료 시 자동 닫기는 YouTube postMessage/API 단계에서 선택 적용)
 */
export function VideoEmbedOverlay({ videoUrl, play, onClose }: VideoEmbedOverlayProps) {
  const resolved = resolvePlay(play, videoUrl)
  const openUrl = resolved?.url ?? null
  const isShorts = openUrl ? isYoutubeShortsLikeUrl(openUrl) : false

  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [entered, setEntered] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const embedSrc = openUrl ? getVideoEmbedSrc(openUrl, { autoplay: true }) : null
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const prevNavRef = useRef(resolved?.prev)
  const nextNavRef = useRef(resolved?.next)
  prevNavRef.current = resolved?.prev
  nextNavRef.current = resolved?.next

  const dialogLabel = resolved?.title?.trim() || '영상 재생'
  const iframeTitle = resolved?.title?.trim() || '영상'

  useEffect(() => {
    setIframeLoaded(false)
  }, [embedSrc])

  useEffect(() => {
    if (!openUrl) {
      setEntered(false)
      return
    }
    setEntered(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(id)
  }, [openUrl])

  useEffect(() => {
    if (!openUrl) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key === 'ArrowLeft' && prevNavRef.current) {
        e.preventDefault()
        prevNavRef.current()
        return
      }
      if (e.key === 'ArrowRight' && nextNavRef.current) {
        e.preventDefault()
        nextNavRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openUrl])

  useEffect(() => {
    if (!openUrl) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [openUrl])

  useEffect(() => {
    if (!openUrl) return
    dialogRef.current?.focus()
  }, [openUrl])

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  const onDialogKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    trapTab(e, dialogRef.current)
  }, [])

  if (!resolved) return null

  const overlayOpacity = entered ? 'opacity-100' : 'opacity-0'
  const panelMotion = entered ? 'scale-100' : 'scale-95 opacity-0'
  const panelMotionReady = 'transition-[transform,opacity] duration-200 ease-out'
  /** 풀폭 패널(최대 너비 제한 없음) */
  const panelMax = 'w-full max-w-none'
  const aspectClass = isShorts ? 'aspect-[9/16]' : 'aspect-video'

  if (!embedSrc) {
    return (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className={`${OVERLAY_Z} ${overlayOpacity} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
        onClick={onClose}
      >
        <div
          className={`relative w-full ${panelMax} rounded-xl bg-white p-6 shadow-lg ${panelMotionReady} ${panelMotion}`}
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
              href={resolved.url}
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

  const thumb = resolveVideoThumbnailUrl(resolved.url, resolved.thumbnail ?? null)
  const showThumb = !iframeLoaded && Boolean(thumb)
  const hasPrev = typeof resolved.prev === 'function'
  const hasNext = typeof resolved.next === 'function'

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      tabIndex={-1}
      onKeyDown={onDialogKeyDown}
      className={`${OVERLAY_Z} ${overlayOpacity} max-sm:min-h-0 max-sm:items-stretch sm:items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
      onClick={onClose}
    >
      <div
        className={`relative flex w-full max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:justify-center ${panelMax} ${panelMotionReady} ${panelMotion}`}
        onClick={stop}
      >
        {hasPrev ? (
          <button
            type="button"
            className="absolute left-0 top-1/2 z-[4] hidden -translate-x-1 -translate-y-1/2 rounded-full bg-black/55 px-2 py-3 text-lg text-white hover:bg-black/75 sm:block"
            aria-label="이전 영상"
            onClick={(e) => {
              e.stopPropagation()
              resolved.prev?.()
            }}
          >
            ‹
          </button>
        ) : null}
        {hasNext ? (
          <button
            type="button"
            className="absolute right-0 top-1/2 z-[4] hidden translate-x-1 -translate-y-1/2 rounded-full bg-black/55 px-2 py-3 text-lg text-white hover:bg-black/75 sm:block"
            aria-label="다음 영상"
            onClick={(e) => {
              e.stopPropagation()
              resolved.next?.()
            }}
          >
            ›
          </button>
        ) : null}

        <div
          className={`relative w-full max-sm:max-h-[min(100dvh,100vh)] overflow-hidden bg-black ${aspectClass}`}
        >
          {showThumb && thumb ? (
            <img
              src={thumb}
              alt=""
              className="absolute inset-0 z-0 h-full w-full scale-105 object-cover blur-sm"
              decoding="async"
            />
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-[4] text-2xl leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] hover:text-gray-200"
            aria-label="닫기"
          >
            ✕
          </button>
          {!iframeLoaded ? (
            <div
              className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-black/45 text-white"
              aria-live="polite"
              aria-busy="true"
            >
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden
              />
              <p className="text-sm opacity-80">영상 준비 중...</p>
            </div>
          ) : null}
          <iframe
            title={iframeTitle}
            src={embedSrc}
            className={`absolute inset-0 z-[1] h-full w-full border-0 transition-opacity duration-200 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
            allow={IFRAME_ALLOW}
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />
        </div>

        {hasPrev || hasNext ? (
          <div className="mt-2 flex justify-center gap-2 sm:hidden">
            {hasPrev ? (
              <button
                type="button"
                className="rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  resolved.prev?.()
                }}
              >
                이전
              </button>
            ) : null}
            {hasNext ? (
              <button
                type="button"
                className="rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  resolved.next?.()
                }}
              >
                다음
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
