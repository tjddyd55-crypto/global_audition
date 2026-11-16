'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { auditionApi, type RankingItem } from '@/shared/api/auditions'
import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'
import { formatCount } from '@/shared/money/currency'
import { isRankingAccessDenied } from '@/shared/audition/rankingAccess'

type Props = {
  auditionId: string
  auditionTitleFallback: string
}

export function AuditionRankingBoard({ auditionId, auditionTitleFallback }: Props) {
  const t = useTranslations('ranking')
  const locale = useLocale()
  const q = useQuery({
    queryKey: ['audition-ranking', auditionId],
    queryFn: () => auditionApi.getRanking(auditionId),
    enabled: !!auditionId,
    retry: false,
  })

  if (q.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">{t('loading')}</div>
    )
  }

  if (q.isError) {
    const forbidden = isRankingAccessDenied(q.error)
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`}>
        <p className={forbidden ? 'text-sm text-neutral-600' : 'text-sm text-red-600'}>
          {forbidden ? t('restricted') : t('loadFailed')}
        </p>
        <Link href={`/auditions/${auditionId}`} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← {t('backToAudition')}
        </Link>
      </div>
    )
  }

  if (q.data && !q.data.votingEnabled) {
    // 공고 투표 설정상 이 회차는 투표·랭킹을 쓰지 않는다(오류 아님).
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`} data-testid="ranking-disabled">
        <p className="text-sm text-neutral-600">{t('disabledRound')}</p>
        <Link href={`/auditions/${auditionId}`} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← {t('backToAudition')}
        </Link>
      </div>
    )
  }

  const page = q.data
  const rows: RankingItem[] = [...(page?.items ?? [])].sort((a, b) => a.rank - b.rank)
  // 공개 응답은 득표·순위만. 점수·추천은 공고 기획사·관리자 화면에서만 보인다.
  const manage = page?.manageView === true

  return (
    <div className="min-h-screen bg-gray-50 pb-10" data-testid="ranking-board">
      <div className="border-b border-violet-100 bg-white py-8">
        <div className={PAGE_CONTAINER}>
          <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 no-underline hover:underline">
            ← {t('backToAudition')}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className={`${TEXT_SUB} mt-1`}>{auditionTitleFallback}</p>
          <p className="mt-1 text-xs text-gray-500" data-testid="ranking-round">
            {t('roundBasis', { round: page?.roundNumber ?? 1 })}
          </p>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6`}>
        {rows.length === 0 ? (
          <p className={TEXT_SUB}>{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t('rank')}</th>
                  <th className="px-4 py-3">{t('name')}</th>
                  <th className="px-4 py-3">{t('votes')}</th>
                  {manage ? <th className="px-4 py-3">{t('score')}</th> : null}
                  {manage ? <th className="px-4 py-3">{t('recommend')}</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.applicationId} className="border-b border-[#E5E7EB] last:border-0">
                    <td className="px-4 py-3 font-semibold text-violet-700">{row.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="inline-flex items-center gap-2">
                        <RankingAvatar url={row.avatarUrl} name={row.userName} />
                        {row.userName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatCount(row.voteCount, locale)}</td>
                    {manage ? <td className="px-4 py-3 text-gray-800">{row.score.toFixed(1)}</td> : null}
                    {manage ? (
                      <td className="px-4 py-3">
                        {row.recommended ? (
                          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-800">TOP3</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ) : null}
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

/** 공개 프로필 이미지(절대 URL)만 쓰고, 없으면 이름 첫 글자. */
function RankingAvatar({ url, name }: { url: string | null; name: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  if (url && /^https?:\/\//i.test(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" />
    )
  }
  return (
    <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
      {initial}
    </span>
  )
}
