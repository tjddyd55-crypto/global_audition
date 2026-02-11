'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '../../../../../lib/api/auditions'
import { applicationApi } from '../../../../../lib/api/applications'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '../../../../../i18n.config'
import { useTranslations } from 'next-intl'

export default function AuditionApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const auditionId = params.id as string

  const { data: audition, isLoading: auditionLoading } = useQuery({
    queryKey: ['audition', auditionId],
    queryFn: () => auditionApi.getById(auditionId),
    enabled: !!auditionId,
  })

  const { data: applications, isLoading: appLoading, error } = useQuery({
    queryKey: ['applications', auditionId],
    queryFn: () => applicationApi.listByAudition(auditionId),
    enabled: !!auditionId,
  })

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) => applicationApi.accept(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', auditionId] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) => applicationApi.reject(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', auditionId] })
    },
  })

  if (auditionLoading || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{t('error')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/auditions/${auditionId}`} className="text-primary-600 hover:underline">
            ← 오디션 상세
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-2">{audition.title}</h1>
        <p className="text-gray-600 mb-8">지원자 목록</p>

        {!applications || applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            아직 지원자가 없습니다.
          </div>
        ) : (
          <ul className="space-y-4">
            {applications.map((app) => (
              <li
                key={app.id}
                className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{app.applicantEmail ?? app.applicantId}</p>
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
                {app.status === 'SUBMITTED' || app.status === 'REVIEWED' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptMutation.mutate(app.id)}
                      disabled={acceptMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      합격
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(app.id)}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      불합격
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
