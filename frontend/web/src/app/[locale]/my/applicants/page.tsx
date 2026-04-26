'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'
import { ApplicantManagementView } from '@/components/audition/ApplicantManagementView'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import MyApplicantsAuditionSelector from '@/components/agency/applicants/MyApplicantsAuditionSelector'
import MyApplicantsEmptyState from '@/components/agency/applicants/MyApplicantsEmptyState'
import { useAuthStore } from '@/shared/auth/authStore'

function MyApplicantsInner() {
  const t = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const { data: auditionsPayload } = useQuery({
    queryKey: ['myAuditions', 0],
    queryFn: () => auditionApi.getMyAuditions({ page: 0, size: 100 }),
    enabled: gateReady && (role === 'AGENCY' || role === 'ADMIN'),
  })

  const list = auditionsPayload?.content ?? []
  const auditionIdFromUrl = searchParams.get('auditionId')?.trim() ?? ''

  const effectiveAuditionId = useMemo(() => {
    if (auditionIdFromUrl && list.some((a) => a.id === auditionIdFromUrl)) {
      return auditionIdFromUrl
    }
    if (list[0]?.id) return list[0].id
    return ''
  }, [auditionIdFromUrl, list])

  const selectedAudition = useMemo(
    () => list.find((a) => a.id === effectiveAuditionId),
    [effectiveAuditionId, list],
  )

  useEffect(() => {
    if (!gateReady || !effectiveAuditionId) return
    if (role !== 'AGENCY' && role !== 'ADMIN') return
    if (auditionIdFromUrl !== effectiveAuditionId) {
      router.replace(`/my/applicants?auditionId=${encodeURIComponent(effectiveAuditionId)}`)
    }
  }, [auditionIdFromUrl, effectiveAuditionId, gateReady, role, router])

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

  if (!effectiveAuditionId || !selectedAudition) {
    return (
      <AgencyDashboardShell>
        <MyApplicantsEmptyState hasAuditions={list.length > 0} />
      </AgencyDashboardShell>
    )
  }

  return (
    <AgencyDashboardShell>
      <MyApplicantsAuditionSelector
        auditions={list}
        value={effectiveAuditionId}
        onChange={(next) => {
          router.replace(`/my/applicants?auditionId=${encodeURIComponent(next)}`)
        }}
      />
      <ApplicantManagementView
        auditionId={effectiveAuditionId}
        auditionTitle={selectedAudition.title}
        backHref="/my/auditions"
        backLabel="← 오디션 관리"
        queryKeyPrefix="my-applicants-hub"
      />
    </AgencyDashboardShell>
  )
}

export default function MyApplicantsPage() {
  return (
    <Suspense
      fallback={
        <AgencyDashboardShell>
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">로딩 중…</div>
        </AgencyDashboardShell>
      }
    >
      <MyApplicantsInner />
    </Suspense>
  )
}
