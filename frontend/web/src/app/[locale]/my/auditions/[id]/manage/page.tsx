'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n.config'
import { useEffect, useState } from 'react'
import { auditionApi } from '@/shared/api/auditions'
import { AuditionManageList } from '@/components/audition/AuditionManageList'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { useAuthStore } from '@/shared/auth/authStore'
import { canManageAudition } from '@/shared/audition/auditionPermissions'
import { auditionHeadlineTitle } from '@/shared/types/audition'

export default function MyAuditionManagePage() {
  const params = useParams()
  const t = useTranslations('common')
  const router = useRouter()
  const auditionId = params.id as string
  const accessToken = useAuthStore((s) => s.accessToken)
  const myUserId = useAuthStore((s) => s.userId)
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
    queryKey: ['audition', auditionId, myUserId ?? 'anon'],
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

  const showAddSeriesRound = canManageAudition({
    accessToken,
    userId: myUserId,
    ownerId: audition.ownerId,
    role,
  })

  return (
    <AgencyDashboardShell>
      <AuditionManageList
        auditionId={auditionId}
        auditionTitleFallback={auditionHeadlineTitle(audition)}
        processMode={audition.processMode ?? 'SINGLE'}
        showAddSeriesRound={showAddSeriesRound}
        backHref="/my/auditions"
      />
    </AgencyDashboardShell>
  )
}
