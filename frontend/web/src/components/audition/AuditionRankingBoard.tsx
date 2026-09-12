'use client'

import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { auditionApi, type RankingItem } from '@/shared/api/auditions'
import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'

type Props = {
  auditionId: string
  auditionTitleFallback: string
}

export function AuditionRankingBoard({ auditionId, auditionTitleFallback }: Props) {
  const t = useTranslations('ranking')
  const tCommon = useTranslations('common')
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
    const forbidden = isAxiosError(q.error) && q.error.response?.status === 403
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`}>
        <p className="text-sm text-red-600">
          {forbidden ? t('restricted') : t('loadFailed')}
        </p>
        <Link href={`/auditions/${auditionId}`} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← {t('backToAudition')}
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
            ← {t('backToAudition')}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className={`${TEXT_SUB} mt-1`}>{auditionTitleFallback}</p>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6`}>
        {rows.length === 0 ? (
          <p className={TEXT_SUB}>{tCommon('empty')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t('rank')}</th>
                  <th className="px-4 py-3">{t('name')}</th>
                  <th className="px-4 py-3">{t('score')}</th>
                  <th className="px-4 py-3">{t('votes')}</th>
                  <th className="px-4 py-3">{t('recommend')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.applicationId} className="border-b border-[#E5E7EB] last:border-0">
                    <td className="px-4 py-3 font-semibold text-violet-700">{row.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.userName || '—'}</td>
                    <td className="px-4 py-3 text-gray-800">{row.score.toFixed(1)}</td>
                    <td className="px-4 py-3 text-gray-700">{row.voteCount.toLocaleString(locale)}</td>
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
