'use client'

import { useQuery } from '@tanstack/react-query'
import { applicationApi } from '@/shared/api/applications'
import { format } from 'date-fns'
import { enUS, ko as koDate, mn } from 'date-fns/locale'
import { Link } from '../../../../i18n.config'
import { useLocale, useTranslations } from 'next-intl'
import { applicationStatusMessageKey } from '@/shared/i18n/applicationStatusKey'

function dateLocale(locale: string) {
  if (locale.startsWith('ko')) return koDate
  if (locale.startsWith('mn')) return mn
  return enUS
}

export default function DashboardApplicationsPage() {
  const t = useTranslations('common')
  const tMy = useTranslations('myApplications')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationApi.listMy(),
  })

  const statusLabel = (status: string) => {
    const key = applicationStatusMessageKey(status)
    return key ? tStatus(key) : status
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{t('error')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">{tMy('title')}</h1>
        {!applications || applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {tMy('empty')}{' '}
            <Link href="/auditions" className="text-primary-600 hover:underline">
              {tMy('browse')}
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {applications.map((app) => (
              <li key={app.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{app.auditionTitle ?? app.auditionId}</p>
                    <p className="text-sm text-gray-500">
                      {tMy('appliedOn', {
                        date: format(new Date(app.createdAt), 'yyyy.MM.dd HH:mm', { locale: dateLocale(locale) }),
                      })}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded text-sm ${
                        app.status === 'ACCEPTED'
                          ? 'bg-green-100 text-green-800'
                          : app.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabel(app.status)}
                    </span>
                  </div>
                  <Link
                    href={`/auditions/${app.auditionId}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    {tMy('browseArrow')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
