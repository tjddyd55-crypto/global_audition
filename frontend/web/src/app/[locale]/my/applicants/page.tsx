'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { auditionApi } from '../../../../lib/api/auditions'
import { ApplicantManagementView } from '@/components/audition/ApplicantManagementView'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { useAuthStore } from '@/lib/auth/authStore'
import { PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'

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
        <div className={`${PAGE_CONTAINER} py-10`}>
          <h1 className="text-xl font-semibold text-gray-900">지원자 관리</h1>
          <p className={`${TEXT_SUB} mt-2`}>
            {list.length === 0
              ? '등록된 오디션이 없습니다. 오디션 관리에서 공고를 만든 뒤 이용해 주세요.'
              : '오디션을 선택해 주세요.'}
          </p>
        </div>
      </AgencyDashboardShell>
    )
  }

  return (
    <AgencyDashboardShell>
      <div className={`${PAGE_CONTAINER} border-b border-gray-200 bg-white py-4`}>
        <label className="block text-xs font-semibold text-gray-500" htmlFor="agency-audition-filter">
          오디션
        </label>
        <select
          id="agency-audition-filter"
          className="mt-1 w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm md:w-auto"
          value={effectiveAuditionId}
          onChange={(e) => {
            const next = e.target.value
            router.replace(`/my/applicants?auditionId=${encodeURIComponent(next)}`)
          }}
        >
          {list.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title} ({a.status})
            </option>
          ))}
        </select>
      </div>
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
