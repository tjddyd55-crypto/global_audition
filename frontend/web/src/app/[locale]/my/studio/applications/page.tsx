'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { applicationApi } from '@/shared/api/applications'
import { applicationStatusMessageKey } from '@/shared/i18n/applicationStatusKey'
import { formatCount } from '@/shared/money/currency'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioApplicationsPage() {
  const t = useTranslations('studio')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const query = useQuery({ queryKey: ['studio', 'applications'], queryFn: applicationApi.listMy })

  return (
    <div className="flex flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('applications')}</h2>
      <p className={TEXT_SUB}>
        {t('applicationsHint')} {query.data ? formatCount(query.data.length, locale) : ''}
      </p>
      {query.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {query.isError ? <p className="text-sm text-red-600">{t('loadFailed')}</p> : null}
      {query.data && query.data.length === 0 ? <p className={TEXT_SUB}>{t('noApplications')}</p> : null}
      <ul className="flex flex-col gap-2">
        {(query.data ?? []).map((item) => {
          const statusKey = applicationStatusMessageKey(item.status)
          return (
            <li key={item.id} className="rounded-lg border border-neutral-200 p-3">
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
