'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { useCallback, useState } from 'react'
import { votesApi, type PublicVoteItem } from '@/lib/api/votes'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'
import { useAuthStore } from '@/lib/auth/authStore'
import { AUDITION_DETAIL, HERO } from '@/lib/design-tokens'

type PublicVoteBoardProps = {
  auditionId: string
  auditionTitle: string
}

export function PublicVoteBoard({ auditionId, auditionTitle }: PublicVoteBoardProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [playItem, setPlayItem] = useState<PublicVoteItem | null>(null)

  const votesQuery = useQuery({
    queryKey: ['audition-votes', auditionId],
    queryFn: () => votesApi.list(auditionId),
    enabled: !!auditionId,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['audition-votes', auditionId] })
  }, [queryClient, auditionId])

  const castMutation = useMutation({
    mutationFn: (applicationId: string) => votesApi.cast(applicationId),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (applicationId: string) => votesApi.remove(applicationId),
    onSuccess: invalidate,
  })

  const requireAuth = useCallback(() => {
    if (!accessToken) {
      router.push(`/login?next=${encodeURIComponent(`/auditions/${auditionId}/votes`)}`)
      return false
    }
    return true
  }, [accessToken, router, auditionId])

  const embed = playItem ? getVideoEmbedSrc(playItem.videoUrl) : null

  if (votesQuery.isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', fontSize: AUDITION_DETAIL.bodyFontPx }}>불러오는 중…</div>
    )
  }

  if (votesQuery.isError) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}>
        투표 정보를 불러오지 못했습니다.
      </div>
    )
  }

  const payload = votesQuery.data
  const items = payload?.items ?? []

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          }}
        >
          공개 투표
        </h1>
        <p style={{ margin: 0, color: AUDITION_DETAIL.metaMutedColor, fontSize: AUDITION_DETAIL.bodyFontPx }}>
          {auditionTitle} · 총 {payload?.totalVotes ?? 0}표
        </p>
      </header>

      {items.length === 0 ? (
        <p style={{ color: AUDITION_DETAIL.metaMutedColor }}>투표 가능한 지원자가 없습니다.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: AUDITION_DETAIL.mainGridGapPx,
          }}
        >
          {items.map((item) => (
            <li
              key={item.applicationId}
              style={{
                border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
                borderRadius: AUDITION_DETAIL.cardRadiusPx,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/10', background: '#111' }}>
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 외부 썸네일 URL
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#222' }} />
                )}
                <button
                  type="button"
                  onClick={() => setPlayItem(item)}
                  disabled={!getVideoEmbedSrc(item.videoUrl)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 'auto',
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    fontSize: 22,
                    cursor: getVideoEmbedSrc(item.videoUrl) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="영상 재생"
                >
                  ▶
                </button>
              </div>
              <div style={{ padding: AUDITION_DETAIL.cardPaddingPx }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.userName || '이름 없음'}</div>
                <div style={{ marginBottom: 12, fontSize: AUDITION_DETAIL.metaMutedPx, color: '#64748b' }}>
                  {[item.category || null, item.viewCount > 0 ? `조회 ${item.viewCount.toLocaleString()}` : null]
                    .filter(Boolean)
                    .join(' · ') || '카테고리 미등록'}
                </div>
                {item.description ? (
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: AUDITION_DETAIL.metaMutedPx,
                      color: AUDITION_DETAIL.metaMutedColor,
                      lineHeight: 1.45,
                      maxHeight: 72,
                      overflow: 'hidden',
                    }}
                  >
                    {item.description}
                  </p>
                ) : null}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: AUDITION_DETAIL.metaMutedPx,
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: '#fef2f2',
                      color: '#b91c1c',
                    }}
                  >
                    ❤️ {item.voteCount.toLocaleString()} 투표
                  </span>
                  {item.isVoted ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireAuth()) return
                        removeMutation.mutate(item.applicationId)
                      }}
                      disabled={removeMutation.isPending}
                      style={{
                        padding: '8px 14px',
                        borderRadius: HERO.buttonRadiusPx,
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        fontWeight: 600,
                        cursor: removeMutation.isPending ? 'wait' : 'pointer',
                      }}
                    >
                      취소
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireAuth()) return
                        castMutation.mutate(item.applicationId)
                      }}
                      disabled={castMutation.isPending}
                      style={{
                        padding: '8px 14px',
                        borderRadius: HERO.buttonRadiusPx,
                        border: 'none',
                        background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
                        color: '#fff',
                        fontWeight: 600,
                        cursor: castMutation.isPending ? 'wait' : 'pointer',
                      }}
                    >
                      투표하기
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {playItem && embed ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setPlayItem(null)}
        >
          <div
            style={{
              width: 'min(960px, 100%)',
              position: 'relative',
              background: '#000',
              borderRadius: AUDITION_DETAIL.videoRadiusPx,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPlayItem(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                title="vote-video"
                src={embed}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
