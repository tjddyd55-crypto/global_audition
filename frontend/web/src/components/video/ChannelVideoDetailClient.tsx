'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from '@/i18n.config'
import { LAYOUT } from '@/lib/design-tokens'
import { DEFAULT_IMAGES } from '@/lib/constants/fallbacks'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'
import { useAuthStore } from '@/lib/auth/authStore'
import {
  bumpChannelVideoView,
  deleteChannelSubscribe,
  fetchChannelVideoPublic,
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

function formatRelativeKo(iso: string): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '방금 전'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}일 전`
  const mon = Math.floor(day / 30)
  return `${mon}개월 전`
}

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
  }
}

type Props = {
  videoId: string
}

export function ChannelVideoDetailClient({ videoId }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [isLoading, setIsLoading] = useState(true)
  const [detail, setDetail] = useState<ChannelVideoPublicDetail | null>(null)
  const [likeBusy, setLikeBusy] = useState(false)
  const [dislikeBusy, setDislikeBusy] = useState(false)
  const [subscribeBusy, setSubscribeBusy] = useState(false)
  const [comments, setComments] = useState<ChannelVideoCommentRow[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [recommendations, setRecommendations] = useState<ChannelVideoRecommendItem[]>([])

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
    if (!videoId) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        await bumpChannelVideoView(videoId).catch((e) => console.error(e))
        const d = await fetchChannelVideoPublic(videoId)
        if (cancelled) return
        setDetail(d)
        const cat = d.category?.trim() ?? ''
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
  }, [videoId])

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

  const outer: CSSProperties = {
    maxWidth: LAYOUT.containerMaxWidth,
    margin: '0 auto',
    padding: `24px ${LAYOUT.containerPaddingPx}px 80px`,
    paddingTop: 88,
  }

  if (isLoading && !detail) {
    return <div style={outer}>불러오는 중…</div>
  }

  if (!detail) {
    return <div style={outer}>영상을 찾을 수 없습니다.</div>
  }

  const showDesc = descriptionExpanded ? (detail.description ?? '') : descParts.preview
  const channelHref = `/channel/${detail.channelOwnerId}`

  return (
    <div style={outer}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%',
              background: '#000',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {embedSrc ? (
              <iframe
                title={detail.title}
                src={embedSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                재생할 수 있는 영상 URL이 없습니다.
              </div>
            )}
          </div>

          {detail.category ? (
            <span
              style={{
                display: 'inline-block',
                marginTop: 12,
                fontSize: 12,
                fontWeight: 600,
                color: ACCENT,
              }}
            >
              {detail.category}
            </span>
          ) : null}

          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 12px', lineHeight: 1.3 }}>{detail.title}</h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#555' }}>
              {detail.viewCount.toLocaleString('ko-KR')} 조회 · {formatRelativeKo(detail.publishedAt)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <button type="button" disabled={likeBusy} onClick={() => void onLike()} style={actionBtnBase(detail.liked)}>
                <span aria-hidden>👍</span>
                <span>{detail.likeCount.toLocaleString('ko-KR')}</span>
              </button>
              <button type="button" disabled={dislikeBusy} onClick={() => void onDislike()} style={actionBtnBase(detail.disliked)}>
                <span aria-hidden>👎</span>
                <span>{detail.dislikeCount.toLocaleString('ko-KR')}</span>
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #eee',
            }}
          >
            <Link
              href={channelHref}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                minWidth: 0,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <Image
                  src={detail.channelProfileImageUrl || DEFAULT_IMAGES.avatar}
                  alt=""
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{detail.channelDisplayName}</div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  구독자 {detail.subscriberCount.toLocaleString('ko-KR')}명
                </div>
              </div>
            </Link>
            <button
              type="button"
              disabled={subscribeBusy}
              onClick={() => void onSubscribe()}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: detail.subscribed ? '#e5e7eb' : `linear-gradient(90deg, ${ACCENT}, #ec4899)`,
                color: detail.subscribed ? '#111' : '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {detail.subscribed ? '구독중' : '구독'}
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: '#f3f4f6',
              borderRadius: 12,
              fontSize: 14,
              lineHeight: 1.6,
              color: '#222',
            }}
          >
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{showDesc}</p>
            {descParts.needsMore ? (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                style={{ marginTop: 8, border: 'none', background: 'none', padding: 0, color: ACCENT, fontWeight: 600, cursor: 'pointer' }}
              >
                {descriptionExpanded ? '접기' : '더보기'}
              </button>
            ) : null}
          </div>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>댓글 {comments.length}개</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20, padding: 12, background: '#f3f4f6', borderRadius: 12 }}>
              <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <Image src={DEFAULT_IMAGES.avatar} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setCommentDraft('')} style={{ border: 'none', background: 'none', color: '#666', cursor: 'pointer' }}>
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={commentBusy}
                    onClick={() => void onSubmitComment()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: 'none',
                      background: ACCENT,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    댓글
                  </button>
                </div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {comments.map((c) => (
                <li key={c.id} style={{ display: 'flex', gap: 12, padding: '16px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <Image
                      src={c.authorProfileImageUrl || DEFAULT_IMAGES.avatar}
                      alt=""
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.authorDisplayName}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>{formatRelativeKo(c.createdAt)}</span>
                    </div>
                    <p style={{ margin: '6px 0 8px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside style={{ flex: '0 0 300px', width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>추천 영상</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recommendations.map((item) => (
              <Link
                key={item.videoId}
                href={`/videos/${item.videoId}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 10 }}
              >
                <div style={{ position: 'relative', width: 160, height: 90, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#eee' }}>
                  <Image
                    src={item.thumbnailUrl || DEFAULT_IMAGES.videoThumbnail}
                    alt=""
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{item.channelDisplayName}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    {item.viewCount.toLocaleString('ko-KR')} 조회 · {formatRelativeKo(item.publishedAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
