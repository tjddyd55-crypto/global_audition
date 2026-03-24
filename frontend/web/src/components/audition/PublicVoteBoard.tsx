'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { auditionApi, type PublicVoteItem } from '@/lib/api/auditions'
import { VideoEmbedOverlay } from '@/components/video/VideoEmbedOverlay'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'
import { useAuthStore } from '@/lib/auth/authStore'
import { Link, useRouter } from '@/i18n.config'
import { HERO } from '@/lib/design-tokens'
import { CARD_BASE, PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'

function formatCount(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

type Props = {
  auditionId: string
  auditionTitleFallback: string
}

export function PublicVoteBoard({ auditionId, auditionTitleFallback }: Props) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [category, setCategory] = useState<string | null>(null)
  const [playItem, setPlayItem] = useState<PublicVoteItem | null>(null)

  const qk = ['audition-votes', auditionId, category ?? '전체'] as const

  const votesQuery = useQuery({
    queryKey: qk,
    queryFn: () => auditionApi.listVotes(auditionId, category),
    enabled: !!auditionId,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['audition-votes', auditionId] })
    queryClient.invalidateQueries({ queryKey: ['audition-ranking', auditionId] })
    queryClient.invalidateQueries({ queryKey: ['audition-manage', auditionId] })
  }, [queryClient, auditionId])

  const openVideoWithViewBump = useCallback(
    (item: PublicVoteItem) => {
      setPlayItem(item)
      if (typeof window === 'undefined') return
      const k = `audition-view-${auditionId}-${item.applicationId}`
      if (sessionStorage.getItem(k)) return
      sessionStorage.setItem(k, '1')
      void auditionApi
        .bumpApplicationView(item.applicationId)
        .then(() => {
          invalidate()
        })
        .catch(() => {
          sessionStorage.removeItem(k)
        })
    },
    [auditionId, invalidate]
  )

  const castMutation = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      auditionApi.vote(auditionId, applicationId),
    onSuccess: (res) => {
      invalidate()
      toast.success(res.replaced ? '투표가 변경되었습니다.' : '투표했습니다.')
    },
    onError: () => toast.error('투표에 실패했습니다.'),
  })

  const removeMutation = useMutation({
    mutationFn: (applicationId: string) => auditionApi.cancelVote(applicationId),
    onSuccess: () => {
      invalidate()
      toast.success('투표를 취소했습니다.')
    },
    onError: () => toast.error('취소에 실패했습니다.'),
  })

  const requireAuth = useCallback(() => {
    if (!accessToken) {
      router.push(`/login?next=${encodeURIComponent(`/auditions/${auditionId}/vote`)}`)
      return false
    }
    return true
  }, [accessToken, router, auditionId])

  const voteMutationBusy = castMutation.isPending || removeMutation.isPending

  if (votesQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">불러오는 중…</div>
    )
  }

  if (votesQuery.isError) {
    return <div className="py-12 text-center text-sm text-red-600">투표 정보를 불러오지 못했습니다.</div>
  }

  const p = votesQuery.data
  const audition = p?.audition
  const summary = p?.summary
  const items = p?.items ?? []
  const title = audition?.title || auditionTitleFallback
  const subCopy = '마음에 드는 지원자에게 투표하고 응원해주세요!'

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero */}
      <div
        className="border-b border-violet-100"
        style={{
          background: `linear-gradient(135deg, ${HERO.primaryGradientStart}22, ${HERO.primaryGradientEnd}18, #fff)`,
          paddingTop: 28,
          paddingBottom: 32,
        }}
      >
        <div className={PAGE_CONTAINER}>
          <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 no-underline hover:underline">
            ← 오디션 상세
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
          <p className={`${TEXT_SUB} mt-2 max-w-2xl text-base text-gray-700`}>{subCopy}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>지원자 {formatCount(audition?.applicantCount ?? summary?.applicantCount ?? 0)}명</span>
            <span>총 투표 {formatCount(audition?.totalVotes ?? summary?.totalVotes ?? 0)}</span>
          </div>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6 flex flex-col gap-6`}>
        {/* 카테고리 탭 */}
        {audition?.categories && audition.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {audition.categories.map((c) => (
              <button
                key={c.name}
                type="button"
                disabled={voteMutationBusy}
                onClick={() => setCategory(c.name === '전체' ? null : c.name)}
                className={
                  (c.name === '전체' && category === null) || c.name === category
                    ? 'rounded-full bg-violet-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60'
                    : 'rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50'
                }
              >
                {c.name}
                {c.name !== '전체' ? ` ${c.count}` : ''}
              </button>
            ))}
          </div>
        )}

        {/* 요약 카드 4개 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label="지원자" value={summary?.applicantCount ?? 0} />
          <SummaryCard label="총 투표" value={summary?.totalVotes ?? 0} />
          <SummaryCard label="총 조회수" value={summary?.totalViewCount ?? 0} />
          <SummaryCard label="내 투표" value={summary?.myVoteCount ?? 0} />
        </div>

        {/* 그리드 */}
        {items.length === 0 ? (
          <p className={`${TEXT_SUB} text-center`}>표시할 지원자가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.applicationId} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
                <div className="relative aspect-[16/10] bg-gray-900">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gray-800" />
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                    👁 {formatCount(item.viewCount)}
                  </span>
                  <button
                    type="button"
                    disabled={!getVideoEmbedSrc(item.videoUrl) || voteMutationBusy}
                    onClick={() => openVideoWithViewBump(item)}
                    className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="재생"
                  >
                    ▶
                  </button>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  {item.category ? (
                    <span className="absolute bottom-3 left-2 rounded-md bg-violet-600/90 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.category}
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="text-base font-bold text-gray-900">{item.userName || '이름 없음'}</p>
                  <p className={`${TEXT_SUB} mt-1 line-clamp-2 text-sm`}>
                    {item.description?.trim() ? item.description : item.userEmail}
                  </p>
                  <div
                    className={`mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-4 ${
                      item.isVoted ? 'ring-2 ring-violet-400 ring-offset-2 rounded-lg -mx-2 px-2 pb-2' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-800">
                      ♥ {formatCount(item.voteCount)} <span className="text-gray-500">투표</span>
                    </span>
                    {item.isVoted ? (
                      <button
                        type="button"
                        disabled={voteMutationBusy}
                        onClick={() => {
                          if (!requireAuth()) return
                          removeMutation.mutate(item.applicationId)
                        }}
                        className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                      >
                        투표 취소
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={voteMutationBusy}
                        onClick={() => {
                          if (!requireAuth()) return
                          castMutation.mutate({ applicationId: item.applicationId })
                        }}
                        className="rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                      >
                        투표하기
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <VideoEmbedOverlay videoUrl={playItem?.videoUrl ?? null} onClose={() => setPlayItem(null)} />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={CARD_BASE + ' text-center'}>
      <div className="text-xl font-bold text-violet-600">{formatCount(value)}</div>
      <div className={TEXT_SUB}>{label}</div>
    </div>
  )
}
