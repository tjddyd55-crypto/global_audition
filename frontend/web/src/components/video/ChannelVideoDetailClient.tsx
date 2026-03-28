'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from '@/i18n.config'
import { VideoListItem } from '@/components/video/VideoListItem'
import { DEFAULT_IMAGES } from '@/lib/constants/fallbacks'
import { resolveThumbnailDisplayUrl } from '@/lib/audition/videoThumbnail'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'
import { useAuthStore } from '@/lib/auth/authStore'
import { formatRelativeKo } from '@/lib/formatRelativeKo'
import {
  bumpChannelVideoView,
  deleteChannelSubscribe,
  listChannelVideoComments,
  listChannelVideosByCategory,
  postChannelSubscribe,
  postChannelVideoComment,
  postChannelVideoDislike,
  postChannelVideoLike,
  type ChannelVideoCommentRow,
  type ChannelVideoPublicDetail,
  type ChannelVideoRecommendItem,
} from '@/lib/api/channelVideoPublic'

const ACCENT = '#7c3aed'
const DESC_PREVIEW_CHARS = 140
const BOOKMARK_STORAGE_KEY = 'ga-bookmarked-channel-videos'

function splitDescription(full: string): { preview: string; needsMore: boolean } {
  const t = (full ?? '').trim()
  if (t.length <= DESC_PREVIEW_CHARS) {
    return { preview: t, needsMore: false }
  }
  return { preview: t.slice(0, DESC_PREVIEW_CHARS).trimEnd() + '…', needsMore: true }
}

function actionBtnBase(active?: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 999,
    border: 'none',
    background: active ? '#ede9fe' : '#f3f4f6',
    color: '#111',
    fontSize: 14,
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  }
}

function readBookmarkIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(BOOKMARK_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeBookmarkIds(ids: Set<string>) {
  window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify([...ids]))
}

type Props = {
  videoId: string
  /** 상위에서 GET /videos/{id}/public 1회로 받은 상세(라우팅과 동일 데이터). */
  initialDetail: ChannelVideoPublicDetail
}

export function ChannelVideoDetailClient({ videoId, initialDetail }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [isLoading, setIsLoading] = useState(true)
  const [detail, setDetail] = useState<ChannelVideoPublicDetail>(() => initialDetail)
  const [likeBusy, setLikeBusy] = useState(false)
  const [dislikeBusy, setDislikeBusy] = useState(false)
  const [subscribeBusy, setSubscribeBusy] = useState(false)
  const [comments, setComments] = useState<ChannelVideoCommentRow[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [recommendations, setRecommendations] = useState<ChannelVideoRecommendItem[]>([])
  const [shareHint, setShareHint] = useState(false)
  const [savedLocal, setSavedLocal] = useState(false)

  const embedSrc = useMemo(() => {
    const url = detail?.videoUrl ?? ''
    return getVideoEmbedSrc(url)
  }, [detail?.videoUrl])

  const descParts = useMemo(() => splitDescription(detail?.description ?? ''), [detail?.description])

  const loadComments = useCallback(async () => {
    if (!videoId) return
    try {
      const list = await listChannelVideoComments(videoId)
      setComments(list)
    } catch (e) {
      console.error(e)
    }
  }, [videoId])

  useEffect(() => {
    setSavedLocal(readBookmarkIds().has(videoId))
  }, [videoId])

  useEffect(() => {
    setDetail(initialDetail)
  }, [initialDetail, videoId])

  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const bumpRes = await bumpChannelVideoView(videoId).catch((e) => {
          console.error(e)
          return null
        })
        if (cancelled) return
        if (bumpRes) {
          setDetail((prev) => (prev ? { ...prev, viewCount: bumpRes.viewCount } : prev))
        }
        const cat = initialDetail.category?.trim() ?? ''
        const [com, rec] = await Promise.all([
          listChannelVideoComments(videoId),
          cat ? listChannelVideosByCategory(cat, videoId) : Promise.resolve([] as ChannelVideoRecommendItem[]),
        ])
        if (!cancelled) {
          setComments(com)
          setRecommendations(rec)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [videoId, initialDetail])

  const onLike = useCallback(async () => {
    if (!videoId) return
    if (!accessToken) {
      console.error('[channel-video] 좋아요는 로그인 후 이용할 수 있습니다.')
      return
    }
    setLikeBusy(true)
    try {
      const res = await postChannelVideoLike(videoId)
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              likeCount: res.likeCount,
              dislikeCount: res.dislikeCount,
              liked: res.liked,
              disliked: res.disliked,
            }
          : prev,
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLikeBusy(false)
    }
  }, [accessToken, videoId])

  const onDislike = useCallback(async () => {
    if (!videoId) return
    if (!accessToken) {
      console.error('[channel-video] 싫어요는 로그인 후 이용할 수 있습니다.')
      return
    }
    setDislikeBusy(true)
    try {
      const res = await postChannelVideoDislike(videoId)
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              likeCount: res.likeCount,
              dislikeCount: res.dislikeCount,
              liked: res.liked,
              disliked: res.disliked,
            }
          : prev,
      )
    } catch (e) {
      console.error(e)
    } finally {
      setDislikeBusy(false)
    }
  }, [accessToken, videoId])

  const onSubscribe = useCallback(async () => {
    if (!detail) return
    if (!accessToken) {
      console.error('[channel-video] 구독은 로그인 후 이용할 수 있습니다.')
      return
    }
    setSubscribeBusy(true)
    try {
      const ownerId = detail.channelOwnerId
      const res = detail.subscribed
        ? await deleteChannelSubscribe(ownerId)
        : await postChannelSubscribe(ownerId)
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              subscribed: res.subscribed,
              subscriberCount: res.subscriberCount,
            }
          : prev,
      )
    } catch (e) {
      console.error(e)
    } finally {
      setSubscribeBusy(false)
    }
  }, [accessToken, detail])

  const onShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = detail?.title ?? ''
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, url })
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      }
      setShareHint(true)
      window.setTimeout(() => setShareHint(false), 2000)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    }
  }, [detail?.title])

  const onToggleSave = useCallback(() => {
    const next = readBookmarkIds()
    if (next.has(videoId)) next.delete(videoId)
    else next.add(videoId)
    writeBookmarkIds(next)
    setSavedLocal(next.has(videoId))
  }, [videoId])

  const onSubmitComment = useCallback(async () => {
    if (!videoId) return
    const text = commentDraft.trim()
    if (!text) return
    if (!accessToken) {
      console.error('[channel-video] 댓글 등록은 로그인 후 이용할 수 있습니다.')
      return
    }
    setCommentBusy(true)
    try {
      await postChannelVideoComment(videoId, text)
      setCommentDraft('')
      await loadComments()
    } catch (e) {
      console.error(e)
    } finally {
      setCommentBusy(false)
    }
  }, [accessToken, videoId, commentDraft, loadComments])

  if (!videoId) {
    return null
  }

  const shellClass = 'w-full pb-20 pt-[88px]'

  if (isLoading && !detail) {
    return <div className={shellClass}>불러오는 중…</div>
  }

  if (!detail) {
    return <div className={shellClass}>영상을 찾을 수 없습니다.</div>
  }

  const showDesc = descriptionExpanded ? (detail.description ?? '') : descParts.preview
  const channelHref = `/channel/${detail.channelOwnerId}`

  return (
    <div className={shellClass}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <div className="min-w-0 flex-1">
          <div className="w-full bg-black aspect-video">
            {embedSrc ? (
              <iframe
                title={detail.title}
                src={embedSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full min-h-[12rem] items-center justify-center px-3 text-center text-sm text-white">
                재생할 수 있는 영상 URL이 없습니다.
              </div>
            )}
          </div>

          {detail.category ? (
            <div className="px-3 pt-2">
              <span className="text-xs font-semibold" style={{ color: ACCENT }}>
                {detail.category}
              </span>
            </div>
          ) : null}

          <div className="px-3 py-3">
            <h1 className="text-base font-semibold leading-snug">{detail.title}</h1>
            <div className="mt-1 text-sm text-neutral-500">
              조회 {detail.viewCount.toLocaleString('ko-KR')}회 · {formatRelativeKo(detail.publishedAt)}
            </div>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" disabled={likeBusy} onClick={() => void onLike()} style={actionBtnBase(detail.liked)}>
              <span aria-hidden>👍</span>
              <span>{detail.likeCount.toLocaleString('ko-KR')}</span>
            </button>
            <button type="button" disabled={dislikeBusy} onClick={() => void onDislike()} style={actionBtnBase(detail.disliked)}>
              <span aria-hidden>👎</span>
              <span>{detail.dislikeCount.toLocaleString('ko-KR')}</span>
            </button>
            <button type="button" onClick={() => void onShare()} style={actionBtnBase(shareHint)}>
              <span aria-hidden>🔗</span>
              <span>{shareHint ? '링크 복사됨' : '공유'}</span>
            </button>
            <button type="button" onClick={() => onToggleSave()} style={actionBtnBase(savedLocal)}>
              <span aria-hidden>⭐</span>
              <span>{savedLocal ? '저장됨' : '저장'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-3 py-3">
            <Link
              href={channelHref}
              className="flex min-w-0 flex-1 items-center gap-3 text-inherit no-underline"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={detail.channelProfileImageUrl || DEFAULT_IMAGES.avatar}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{detail.channelDisplayName}</div>
                <div className="text-xs text-neutral-500">
                  구독자 {detail.subscriberCount.toLocaleString('ko-KR')}명
                </div>
              </div>
            </Link>
            <button
              type="button"
              disabled={subscribeBusy}
              onClick={() => void onSubscribe()}
              className="shrink-0 px-4 py-1 text-sm font-semibold text-white"
              style={{
                borderRadius: 999,
                border: 'none',
                background: detail.subscribed ? '#e5e7eb' : `linear-gradient(90deg, ${ACCENT}, #ec4899)`,
                color: detail.subscribed ? '#111' : '#fff',
                cursor: 'pointer',
              }}
            >
              {detail.subscribed ? '구독중' : '구독'}
            </button>
          </div>

          <div className="border-b border-neutral-200 px-3 py-3 text-sm leading-relaxed text-neutral-800">
            <p className="m-0 whitespace-pre-wrap">{showDesc}</p>
            {descParts.needsMore ? (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="mt-2 border-0 bg-transparent p-0 text-sm font-semibold"
                style={{ color: ACCENT, cursor: 'pointer' }}
              >
                {descriptionExpanded ? '접기' : '더보기'}
              </button>
            ) : null}
          </div>

          <section className="px-3 pt-4">
            <h2 className="mb-3 text-base font-bold">댓글 {comments.length}개</h2>
            <div className="mb-4 flex gap-3 border-b border-neutral-200 pb-4">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image src={DEFAULT_IMAGES.avatar} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="mb-2 box-border w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCommentDraft('')}
                    className="cursor-pointer border-0 bg-transparent text-sm text-neutral-600"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={commentBusy}
                    onClick={() => void onSubmitComment()}
                    className="cursor-pointer rounded-full border-0 px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: ACCENT }}
                  >
                    댓글
                  </button>
                </div>
              </div>
            </div>
            <ul className="m-0 list-none p-0">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3 border-b border-neutral-200 py-4 last:border-b-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={c.authorProfileImageUrl || DEFAULT_IMAGES.avatar}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold">{c.authorDisplayName}</span>
                      <span className="text-xs text-neutral-500">{formatRelativeKo(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 mb-0 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="w-full border-t border-neutral-200 px-0 py-6 lg:w-[360px] lg:flex-shrink-0 lg:border-t-0 lg:border-l lg:border-neutral-200 lg:py-4 lg:pl-4 lg:pr-3">
          <h2 className="mb-3 px-3 text-base font-bold lg:px-0">추천 영상</h2>
          <div className="w-full">
            {recommendations.map((item, index) => (
              <div key={item.videoId} className={index > 0 ? 'mt-4' : ''}>
                <VideoListItem
                  href={`/videos/${item.videoId}`}
                  title={item.title}
                  thumbnailSrc={resolveThumbnailDisplayUrl(item.thumbnailUrl)}
                  channelName={item.channelDisplayName}
                  channelImageSrc={null}
                  viewCount={item.viewCount}
                  dateLabel={formatRelativeKo(item.publishedAt)}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
