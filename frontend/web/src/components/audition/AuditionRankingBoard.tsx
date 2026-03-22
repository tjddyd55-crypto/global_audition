'use client'

import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link } from '@/i18n.config'
import { auditionApi, type RankingItem } from '@/lib/api/auditions'
import { PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'

type Props = {
  auditionId: string
  auditionTitleFallback: string
}

export function AuditionRankingBoard({ auditionId, auditionTitleFallback }: Props) {
  const q = useQuery({
    queryKey: ['audition-ranking', auditionId],
    queryFn: () => auditionApi.getRanking(auditionId),
    enabled: !!auditionId,
    retry: false,
  })

  if (q.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">불러오는 중…</div>
    )
  }

  if (q.isError) {
    const forbidden = isAxiosError(q.error) && q.error.response?.status === 403
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`}>
        <p className="text-sm text-red-600">
          {forbidden ? '랭킹은 기획사·관리자만 조회할 수 있습니다.' : '랭킹을 불러오지 못했습니다.'}
        </p>
        <Link href={`/auditions/${auditionId}`} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← 오디션 상세
        </Link>
      </div>
    )
  }

  const rows: RankingItem[] = [...(q.data ?? [])].sort((a, b) => a.rank - b.rank)

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="border-b border-violet-100 bg-white py-8">
        <div className={PAGE_CONTAINER}>
          <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 no-underline hover:underline">
            ← 오디션 상세
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">랭킹</h1>
          <p className={`${TEXT_SUB} mt-1`}>{auditionTitleFallback}</p>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6`}>
        {rows.length === 0 ? (
          <p className={TEXT_SUB}>표시할 항목이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">순위</th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">점수</th>
                  <th className="px-4 py-3">투표</th>
                  <th className="px-4 py-3">추천</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.applicationId} className="border-b border-[#E5E7EB] last:border-0">
                    <td className="px-4 py-3 font-semibold text-violet-700">{row.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.userName || '—'}</td>
                    <td className="px-4 py-3 text-gray-800">{row.score.toFixed(1)}</td>
                    <td className="px-4 py-3 text-gray-700">{row.voteCount.toLocaleString('ko-KR')}</td>
                    <td className="px-4 py-3">
                      {row.recommended ? (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-800">TOP3</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
