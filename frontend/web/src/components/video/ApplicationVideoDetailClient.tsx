'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import { Link } from '@/i18n.config'
import { LAYOUT } from '@/lib/design-tokens'
import { DEFAULT_IMAGES } from '@/lib/constants/fallbacks'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'
import { useAuthStore } from '@/lib/auth/authStore'
import { auditionApi } from '@/lib/api/auditions'
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
} from '@/lib/api/applicationPublicVideo'

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

export function ApplicationVideoDetailClient() {
  const params = useParams()
  const applicationId = typeof params?.applicationId === 'string' ? params.applicationId : ''
  const accessToken = useAuthStore((s) => s.accessToken)

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
      console.error('[video-detail] 좋아요는 로그인 후 이용할 수 있습니다.')
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
      console.error('[video-detail] 투표는 로그인 후 이용할 수 있습니다.')
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

  const onSubmitComment = useCallback(async () => {
    if (!applicationId) return
    const text = commentDraft.trim()
    if (!text) return
    if (!accessToken) {
      console.error('[video-detail] 댓글 등록은 로그인 후 이용할 수 있습니다.')
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
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
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
              <button type="button" disabled={likeBusy} onClick={() => void onLike()} style={actionBtnBase(isLiked)}>
                <span aria-hidden>👍</span>
                <span>{likeCount.toLocaleString('ko-KR')}</span>
              </button>
              <button type="button" style={actionBtnBase()}>
                <span aria-hidden>👎</span>
              </button>
              <button type="button" disabled={voteBusy} onClick={() => void onVote()} style={actionBtnBase(isVoted)}>
                {isVoted ? '투표 취소' : '투표하기'}
              </button>
              <button type="button" style={actionBtnBase()}>
                공유
              </button>
              <button type="button" style={actionBtnBase()}>
                ⚑
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
            <button
              type="button"
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: `linear-gradient(90deg, ${ACCENT}, #ec4899)`,
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              구독
            </button>
          </div>

          <div style={{ marginTop: 16, padding: 16, background: '#f3f4f6', borderRadius: 12, fontSize: 14, lineHeight: 1.6, color: '#222' }}>
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
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#666' }}>
                      <span>👍 0</span>
                      <button type="button" style={{ border: 'none', background: 'none', padding: 0, color: '#666', cursor: 'pointer' }}>
                        답글
                      </button>
                    </div>
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
                key={item.applicationId}
                href={`/videos/${item.applicationId}`}
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
