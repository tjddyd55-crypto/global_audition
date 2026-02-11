'use client'

import { useQuery } from '@tanstack/react-query'
import { applicationApi } from '../../../../lib/api/applications'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '../../../../i18n.config'
import { useTranslations } from 'next-intl'

export default function DashboardApplicationsPage() {
  const t = useTranslations('common')
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationApi.listMy(),
  })

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
        <h1 className="text-2xl font-bold mb-8">내 지원 목록</h1>
        {!applications || applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            지원한 오디션이 없습니다.{' '}
            <Link href="/auditions" className="text-primary-600 hover:underline">
              오디션 보기
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
                      지원일: {format(new Date(app.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
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
                      {app.status === 'ACCEPTED' ? 'Accepted 🎉' : app.status === 'REJECTED' ? 'Rejected' : app.status}
                    </span>
                  </div>
                  <Link
                    href={`/auditions/${app.auditionId}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    오디션 보기 →
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
