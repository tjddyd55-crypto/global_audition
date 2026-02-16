'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, Link } from '../../../../i18n.config'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../../../lib/api/auth'
import { dashboardApi } from '../../../../lib/api/dashboard'
import { useTranslations } from 'next-intl'

function statusLabel(status?: string) {
  if (status === 'ACCEPTED') return '합격'
  if (status === 'REJECTED') return '불합격'
  if (status === 'REVIEWED') return '검토완료'
  if (status === 'SUBMITTED') return '제출완료'
  return status ?? '-'
}

export default function MyDashboardPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const role = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null),
    []
  )

  useEffect(() => {
    if (!authApi.getToken()) {
      router.push('/login')
    }
  }, [router])

  const agencyQuery = useQuery({
    queryKey: ['dashboard', 'agency'],
    queryFn: dashboardApi.getAgency,
    enabled: role === 'AGENCY' || role === 'ADMIN',
  })

  const applicantQuery = useQuery({
    queryKey: ['dashboard', 'applicant'],
    queryFn: dashboardApi.getApplicant,
    enabled: role === 'APPLICANT',
  })

  if (agencyQuery.isLoading || applicantQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>
  }

  if (role === 'AGENCY' || role === 'ADMIN') {
    const data = agencyQuery.data
    if (!data) return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error')}</div>
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">기획자/관리자 대시보드</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-4 shadow">공고수: {data.totalAuditions}</div>
            <div className="bg-white rounded p-4 shadow">진행중: {data.openAuditions}</div>
            <div className="bg-white rounded p-4 shadow">지원수: {data.totalApplications}</div>
            <div className="bg-white rounded p-4 shadow">합격: {data.accepted}</div>
            <div className="bg-white rounded p-4 shadow">불합격: {data.rejected}</div>
            <div className="bg-white rounded p-4 shadow">대기: {data.pending}</div>
          </div>
          <div className="flex gap-3">
            <Link href="/auditions/create" className="px-4 py-2 bg-blue-600 text-white rounded">공고 등록</Link>
            <Link href="/my/auditions" className="px-4 py-2 bg-gray-700 text-white rounded">내 공고 관리</Link>
          </div>
          <div className="bg-white rounded p-4 shadow">
            <h2 className="font-bold mb-2">최근 지원</h2>
            <ul className="space-y-2">
              {data.recentApplications.map((a) => (
                <li key={a.id} className="text-sm">
                  {a.auditionTitle ?? a.auditionId} - {a.applicantEmail ?? a.applicantId} - {statusLabel(a.status)}
                </li>
              ))}
              {data.recentApplications.length === 0 && <li className="text-sm text-gray-500">데이터 없음</li>}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const applicant = applicantQuery.data
  if (!applicant) return <div className="min-h-screen flex items-center justify-center text-red-500">{t('error')}</div>
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">지원자 대시보드</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded p-4 shadow">지원: {applicant.applied}</div>
          <div className="bg-white rounded p-4 shadow">검토: {applicant.reviewed}</div>
          <div className="bg-white rounded p-4 shadow">합격: {applicant.accepted}</div>
          <div className="bg-white rounded p-4 shadow">불합격: {applicant.rejected}</div>
          <div className="bg-white rounded p-4 shadow">영상 수: {applicant.videosCount}</div>
        </div>
        <div className="flex gap-3">
          <Link href="/auditions" className="px-4 py-2 bg-blue-600 text-white rounded">오디션 보기</Link>
          <Link href="/my/applications" className="px-4 py-2 bg-gray-700 text-white rounded">내 지원서</Link>
        </div>
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-bold mb-2">최근 지원</h2>
          <ul className="space-y-2">
            {applicant.recentApplications.map((a) => (
              <li key={a.id} className="text-sm">
                <Link href={`/my/applications/${a.id}`} className="hover:underline">
                  {a.auditionTitle ?? a.auditionId} - {statusLabel(a.status)}
                </Link>
              </li>
            ))}
            {applicant.recentApplications.length === 0 && <li className="text-sm text-gray-500">데이터 없음</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
