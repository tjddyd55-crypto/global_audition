'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n.config'
import { Link } from '@/i18n.config'
import { useEffect, useState } from 'react'
import { auditionApi } from '@/shared/api/auditions'
import { AuditionRoundReviewPanel } from '@/components/audition/AuditionRoundReviewPanel'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'
import { useAuthStore } from '@/shared/auth/authStore'

export default function MyAuditionRoundReviewPage() {
  const params = useParams()
  const t = useTranslations('common')
  const router = useRouter()
  const auditionId = params.id as string
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  const [gateReady, setGateReady] = useState(false)

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setGateReady(true)
  }, [])

  useEffect(() => {
    if (!gateReady) return
    if (!accessToken) {
      router.replace('/login')
      return
    }
    if (role !== 'AGENCY' && role !== 'ADMIN') {
      router.replace('/')
    }
  }, [accessToken, gateReady, role, router])

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', auditionId],
    queryFn: () => auditionApi.getById(auditionId),
    enabled: !!auditionId && gateReady && (role === 'AGENCY' || role === 'ADMIN'),
  })

  if (!gateReady || role === null) {
    return (
      <AgencyDashboardShell>
        <div className="flex min-h-[40vh] items-center justify-center">{t('loading')}</div>
      </AgencyDashboardShell>
    )
  }

  if (role !== 'AGENCY' && role !== 'ADMIN') {
    return null
  }

  if (isLoading) {
    return (
      <AgencyDashboardShell>
        <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
      </AgencyDashboardShell>
    )
  }

  if (error || !audition) {
    return (
      <AgencyDashboardShell>
        <div className="flex min-h-screen items-center justify-center text-red-600">{t('error')}</div>
      </AgencyDashboardShell>
    )
  }

  if (audition.processMode !== 'MULTI_ROUND') {
    return (
      <AgencyDashboardShell>
        <div className={`${PAGE_CONTAINER} py-16`}>
          <h1 className="text-xl font-semibold text-gray-900">다단계 라운드 심사</h1>
          <p className={`${TEXT_SUB} mt-2`}>이 오디션은 단일(SINGLE) 모드입니다. 지원자 관리에서 처리할 수 있습니다.</p>
          <Link
            href={`/my/applicants?auditionId=${encodeURIComponent(auditionId)}`}
            className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline"
          >
            ← 지원자 관리
          </Link>
        </div>
      </AgencyDashboardShell>
    )
  }

  return (
    <AgencyDashboardShell>
      <AuditionRoundReviewPanel auditionId={auditionId} auditionTitle={audition.title} />
    </AgencyDashboardShell>
  )
}
