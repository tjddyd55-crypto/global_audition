'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { dashboardApi } from '@/shared/api/dashboard'
import { formatCount } from '@/shared/money/currency'
import { applicationStatusMessageKey } from '@/shared/i18n/applicationStatusKey'
import { CARD_BASE, TEXT_SUB } from '@/shared/ui/specClasses'

export default function StudioDashboardPage() {
  const t = useTranslations('studio')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const query = useQuery({ queryKey: ['studio', 'dashboard'], queryFn: dashboardApi.getApplicant })

  if (query.isLoading) {
    return <p className={TEXT_SUB}>{t('loginRequired')}</p>
  }
  if (query.isError || !query.data) {
    return <p className="text-sm text-red-600">{t('saveFailed')}</p>
  }

  const cards = [
    ['applied', query.data.applied],
    ['reviewed', query.data.reviewed],
    ['accepted', query.data.accepted],
    ['rejected', query.data.rejected],
    ['videos', query.data.videosCount],
  ] as const

  return (
    <div className="flex flex-col gap-4">
      <p className={TEXT_SUB}>{t('dashboardHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([key, value]) => (
          <div key={key} className={CARD_BASE}>
            <div className="text-xl font-bold text-gray-900">{formatCount(value, locale)}</div>
            <div className={TEXT_SUB}>{t(key)}</div>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {query.data.recentApplications.map((item) => {
          const statusKey = applicationStatusMessageKey(item.status)
          return (
            <li key={item.id} className={CARD_BASE}>
              <Link href={`/my/applications/${item.id}`} className="font-medium text-gray-900">
                {item.auditionTitle}
              </Link>
              <div className={TEXT_SUB}>{statusKey ? tStatus(statusKey) : item.status}</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
