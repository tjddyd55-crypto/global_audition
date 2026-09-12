'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import { VideoListItem } from '@/components/video/VideoListItem'
import { DEFAULT_IMAGES } from '@/shared/constants/fallbacks'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { useAuthStore } from '@/shared/auth/authStore'
import { auditionApi } from '@/shared/api/auditions'
import { formatRelative } from '@/shared/i18n/formatRelative'
import { useLocale, useTranslations } from 'next-intl'
import {
  bumpApplicationViewPublic,
  deleteApplicationLike,
  fetchApplicationPublic,
  listApplicationComments,
  listApplicationsExclude,
  postApplicationComment,
  postApplicationLike,
  type ApplicationCommentRow,
  type ApplicationPublicDetail,
  type ApplicationRecommendItem,
} from '@/shared/api/applicationPublicVideo'

const ACCENT = '#7c3aed'
const DESC_PREVIEW_CHARS = 140
const BOOKMARK_STORAGE_KEY = 'ga-bookmarked-application-videos'

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

export function ApplicationVideoDetailClient() {
  const params = useParams()
  const applicationId = typeof params?.applicationId === 'string' ? params.applicationId : ''
  const accessToken = useAuthStore((s) => s.accessToken)
  const locale = useLocale()
  const tVideo = useTranslations('video')
  const tChannel = useTranslations('channel')
  const tCommon = useTranslations('common')
  const tVote = useTranslations('vote')
  const tRelative = useTranslations('relative')
  const numberLocale = locale.startsWith('ko') ? 'ko-KR' : locale.startsWith('mn') ? 'mn-MN' : 'en-US'

  const [isLoading, setIsLoading] = useState(true)
  const [detail, setDetail] = useState<ApplicationPublicDetail | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isVoted, setIsVoted] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [voteBusy, setVoteBusy] = useState(false)
  const [comments, setComments] = useState<ApplicationCommentRow[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [recommendations, setRecommendations] = useState<ApplicationRecommendItem[]>([])
  const [shareHint, setShareHint] = useState(false)
  const [savedLocal, setSavedLocal] = useState(false)

  const embedSrc = useMemo(() => {
    const url = detail?.videoUrl ?? ''
    return getVideoEmbedSrc(url)
  }, [detail?.videoUrl])

  const descParts = useMemo(() => splitDescription(detail?.description ?? ''), [detail?.description])

  const loadComments = useCallback(async () => {
    if (!applicationId) return
    try {
      const list = await listApplicationComments(applicationId)
      setComments(list)
    } catch (e) {
      console.error(e)
    }
  }, [applicationId])

  const refreshDetail = useCallback(async () => {
    if (!applicationId) return
    try {
      const d = await fetchApplicationPublic(applicationId)
      setDetail(d)
      setIsLiked(d.isLiked)
      setLikeCount(d.likeCount)
      setIsVoted(d.isVoted)
    } catch (e) {
      console.error(e)
    }
  }, [applicationId])

  useEffect(() => {
    setSavedLocal(readBookmarkIds().has(applicationId))
  }, [applicationId])

  useEffect(() => {
    if (!applicationId) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        await bumpApplicationViewPublic(applicationId).catch((e) => console.error(e))
        const d = await fetchApplicationPublic(applicationId)
        if (cancelled) return
        setDetail(d)
        setIsLiked(d.isLiked)
        setLikeCount(d.likeCount)
        setIsVoted(d.isVoted)
        const [com, rec] = await Promise.all([
          listApplicationComments(applicationId),
          listApplicationsExclude(applicationId),
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
  }, [applicationId])

  const onLike = useCallback(async () => {
    if (!applicationId) return
    if (!accessToken) {
      console.error('[video-detail] like requires login')
      return
    }
    setLikeBusy(true)
    try {
      const res = isLiked ? await deleteApplicationLike(applicationId) : await postApplicationLike(applicationId)
      setLikeCount(res.likeCount)
      setIsLiked(res.isLiked)
    } catch (e) {
      console.error(e)
    } finally {
      setLikeBusy(false)
    }
  }, [accessToken, applicationId, isLiked])

  const onVote = useCallback(async () => {
    if (!applicationId || !detail) return
    if (!accessToken) {
      console.error('[video-detail] vote requires login')
      return
    }
    setVoteBusy(true)
    try {
      if (isVoted) {
        await auditionApi.cancelVote(applicationId)
      } else {
        await auditionApi.vote(detail.auditionId, applicationId)
      }
      await refreshDetail()
    } catch (e) {
      console.error(e)
    } finally {
      setVoteBusy(false)
    }
  }, [accessToken, applicationId, detail, isVoted, refreshDetail])

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
    if (next.has(applicationId)) next.delete(applicationId)
    else next.add(applicationId)
    writeBookmarkIds(next)
    setSavedLocal(next.has(applicationId))
  }, [applicationId])

  const onSubmitComment = useCallback(async () => {
    if (!applicationId) return
    const text = commentDraft.trim()
    if (!text) return
    if (!accessToken) {
      console.error('[video-detail] comment requires login')
      return
    }
    setCommentBusy(true)
    try {
      await postApplicationComment(applicationId, text)
      setCommentDraft('')
      await loadComments()
    } catch (e) {
      console.error(e)
    } finally {
      setCommentBusy(false)
    }
  }, [accessToken, applicationId, commentDraft, loadComments])

  if (!applicationId) {
    return null
  }

  const shellClass = 'w-full pb-20 pt-[88px]'

  if (isLoading && !detail) {
    return (
      <div className={shellClass}>
        <p className="px-4 py-3">{tVideo('loading')}</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className={shellClass}>
        <p className="px-4 py-3">{tVideo('notFound')}</p>
      </div>
    )
  }

  const showDesc = descriptionExpanded ? (detail.description ?? '') : descParts.preview

  return (
    <div className={shellClass}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <div className="min-w-0 flex-1">
          <div className="aspect-video w-full bg-black">
            {embedSrc ? (
              <iframe
                title={detail.title}
                src={embedSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-white">
                {tVideo('noPlayableUrl')}
              </div>
            )}
          </div>

          {detail.category ? (
            <div className="px-4 pt-2">
              <span className="text-xs font-semibold" style={{ color: ACCENT }}>
                {detail.category}
              </span>
            </div>
          ) : null}

          <div className="px-4 py-3">
            <h1 className="text-base font-semibold leading-snug">{detail.title}</h1>
            <div className="mt-1 text-sm text-neutral-500">
              {tVideo('viewsCount', { n: detail.viewCount.toLocaleString(numberLocale) })} · {formatRelative(detail.publishedAt, tRelative)}
            </div>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" disabled={likeBusy} onClick={() => void onLike()} style={actionBtnBase(isLiked)}>
              <span aria-hidden>👍</span>
              <span>{likeCount.toLocaleString(numberLocale)}</span>
            </button>
            <button type="button" style={actionBtnBase()}>
              <span aria-hidden>👎</span>
              <span>{tVideo('dislike')}</span>
            </button>
            <button type="button" disabled={voteBusy} onClick={() => void onVote()} style={actionBtnBase(isVoted)}>
              {isVoted ? tVote('cancelVote') : tVote('voteAction')}
            </button>
            <button type="button" onClick={() => void onShare()} style={actionBtnBase(shareHint)}>
              <span aria-hidden>🔗</span>
              <span>{shareHint ? tVideo('linkCopied') : tChannel('share')}</span>
            </button>
            <button type="button" onClick={() => onToggleSave()} style={actionBtnBase(savedLocal)}>
              <span aria-hidden>⭐</span>
              <span>{savedLocal ? tVideo('saved') : tCommon('save')}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
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
                  {tVideo('subscribersCount', { n: detail.subscriberCount.toLocaleString(numberLocale) })}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 px-4 py-1 text-sm font-semibold text-white"
              style={{
                borderRadius: 999,
                border: 'none',
                background: `linear-gradient(90deg, ${ACCENT}, #ec4899)`,
                cursor: 'pointer',
              }}
            >
              {tChannel('subscribe')}
            </button>
          </div>

          <div className="border-b border-neutral-200 px-4 py-3 text-sm leading-relaxed text-neutral-800">
            <p className="m-0 whitespace-pre-wrap">{showDesc}</p>
            {descParts.needsMore ? (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="mt-2 border-0 bg-transparent p-0 text-sm font-semibold"
                style={{ color: ACCENT, cursor: 'pointer' }}
              >
                {descriptionExpanded ? tVideo('collapse') : tVideo('more')}
              </button>
            ) : null}
          </div>

          <section className="px-4 pt-4">
            <h2 className="mb-3 text-base font-bold">{tVideo('commentsCount', { n: comments.length })}</h2>
            <div className="mb-4 flex gap-3 border-b border-neutral-200 pb-4">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image src={DEFAULT_IMAGES.avatar} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={tVideo('commentPlaceholder')}
                  className="mb-2 box-border w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCommentDraft('')}
                    className="cursor-pointer border-0 bg-transparent text-sm text-neutral-600"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={commentBusy}
                    onClick={() => void onSubmitComment()}
                    className="cursor-pointer rounded-full border-0 px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: ACCENT }}
                  >
                    {tVideo('commentSubmit')}
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
                      <span className="text-xs text-neutral-500">{formatRelative(c.createdAt, tRelative)}</span>
                    </div>
                    <p className="mt-1 mb-0 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                      <span>👍 0</span>
                      <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-neutral-500">
                        {tVideo('reply')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="w-full border-t border-neutral-200 px-0 py-6 lg:w-[360px] lg:flex-shrink-0 lg:border-t-0 lg:border-l lg:border-neutral-200 lg:py-4 lg:pl-4 lg:pr-3">
          <h2 className="mb-3 px-4 text-base font-bold lg:px-0">{tVideo('recommended')}</h2>
          <div className="w-full">
            {recommendations.map((item, index) => (
              <div key={item.applicationId} className={index > 0 ? 'mt-4' : ''}>
                <VideoListItem
                  href={`/videos/${item.applicationId}`}
                  title={item.title}
                  thumbnailSrc={item.thumbnailUrl}
                  channelName={item.channelDisplayName}
                  channelImageSrc={null}
                  viewCount={item.viewCount}
                  dateLabel={formatRelative(item.publishedAt, tRelative)}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
