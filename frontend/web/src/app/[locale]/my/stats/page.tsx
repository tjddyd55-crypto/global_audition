'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { useTranslations } from 'next-intl'
import { dashboardApi } from '../../../../lib/api/dashboard'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { useAuthStore } from '@/lib/auth/authStore'
import { PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'

export default function MyAgencyStatsPage() {
  const t = useTranslations('common')
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!accessToken) {
      router.replace('/login')
      return
    }
    if (role !== 'AGENCY' && role !== 'ADMIN') {
      router.replace('/')
    }
  }, [accessToken, hydrated, role, router])

  const q = useQuery({
    queryKey: ['dashboard', 'agency'],
    queryFn: dashboardApi.getAgency,
    enabled: hydrated && (role === 'AGENCY' || role === 'ADMIN'),
  })

  if (!hydrated || q.isLoading) {
    return (
      <AgencyDashboardShell>
        <div className="flex min-h-[40vh] items-center justify-center">{t('loading')}</div>
      </AgencyDashboardShell>
    )
  }

  if (role !== 'AGENCY' && role !== 'ADMIN') {
    return null
  }

  const data = q.data
  if (!data || q.isError) {
    return (
      <AgencyDashboardShell>
        <div className={`${PAGE_CONTAINER} py-10 text-red-600`}>{t('error')}</div>
      </AgencyDashboardShell>
    )
  }

  const rows: { label: string; value: number }[] = [
    { label: '등록 공고 수', value: data.totalAuditions },
    { label: '진행 중 공고', value: data.openAuditions },
    { label: '누적 지원', value: data.totalApplications },
    { label: '합격', value: data.accepted },
    { label: '불합격', value: data.rejected },
    { label: '대기·검토', value: data.pending },
  ]

  return (
    <AgencyDashboardShell>
      <div className={`${PAGE_CONTAINER} py-8`}>
        <h1 className="text-xl font-semibold text-gray-900">통계</h1>
        <p className={`${TEXT_SUB} mt-1`}>기획사 계정 기준 집계입니다.</p>
        <div className="mt-6 divide-y divide-gray-200 border border-gray-200 bg-white">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-gray-700">{row.label}</span>
              <span className="tabular-nums font-semibold text-gray-900">
                {row.value.toLocaleString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AgencyDashboardShell>
  )
}
