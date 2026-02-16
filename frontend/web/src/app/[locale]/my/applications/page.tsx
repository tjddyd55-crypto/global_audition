'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../i18n.config'
import { applicationApi } from '../../../../lib/api/applications'

export default function MyApplicationsPage() {
  const t = useTranslations('common')
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationApi.listMy(),
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error')}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">내 지원서</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul>
            {(data ?? []).map((app) => (
              <li key={app.id} className="border-b p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{app.auditionTitle ?? app.auditionId}</p>
                  <p className="text-sm text-gray-500">{new Date(app.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{app.status}</span>
                  <Link href={`/my/applications/${app.id}`} className="text-blue-600 hover:underline">상세</Link>
                </div>
              </li>
            ))}
            {(data ?? []).length === 0 && <li className="p-6 text-center text-gray-500">지원 내역이 없습니다.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
