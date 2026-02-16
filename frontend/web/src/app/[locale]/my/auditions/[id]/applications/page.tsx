'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../../i18n.config'
import { applicationApi } from '../../../../../../lib/api/applications'
import { auditionApi } from '../../../../../../lib/api/auditions'

function statusLabel(status: string) {
  if (status === 'SUBMITTED') return '제출'
  if (status === 'REVIEWED') return '검토'
  if (status === 'ACCEPTED') return '합격'
  if (status === 'REJECTED') return '불합격'
  return status
}

export default function MyAuditionApplicationsPage() {
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('common')
  const queryClient = useQueryClient()

  const auditionQuery = useQuery({
    queryKey: ['my-audition', id],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })
  const applicationsQuery = useQuery({
    queryKey: ['my-audition-applications', id],
    queryFn: () => applicationApi.listByAudition(id),
    enabled: !!id,
  })

  const reviewedMutation = useMutation({
    mutationFn: (applicationId: string) => applicationApi.markReviewed(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-audition-applications', id] }),
  })
  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) => applicationApi.accept(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-audition-applications', id] }),
  })
  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) => applicationApi.reject(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-audition-applications', id] }),
  })

  if (auditionQuery.isLoading || applicationsQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>
  }
  if (!auditionQuery.data) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error')}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/my/auditions" className="text-sm text-blue-600 hover:underline">
            ← 내 오디션 목록
          </Link>
          <h1 className="text-2xl font-bold mt-2">{auditionQuery.data.title}</h1>
        </div>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">지원자</th>
                <th className="p-3 text-left">상태</th>
                <th className="p-3 text-left">지원일</th>
                <th className="p-3 text-left">처리</th>
              </tr>
            </thead>
            <tbody>
              {(applicationsQuery.data ?? []).map((app) => (
                <tr key={app.id} className="border-t">
                  <td className="p-3">{app.applicantEmail ?? app.applicantId}</td>
                  <td className="p-3">{statusLabel(app.status)}</td>
                  <td className="p-3">{new Date(app.createdAt).toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => reviewedMutation.mutate(app.id)}>검토</button>
                    <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => acceptMutation.mutate(app.id)}>합격</button>
                    <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => rejectMutation.mutate(app.id)}>불합격</button>
                  </td>
                </tr>
              ))}
              {(applicationsQuery.data ?? []).length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={4}>지원자가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
