'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { useAuthStore } from '@/shared/auth/authStore'
import { agencyCastingApi } from '@/shared/api/casting'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { PAGE_CONTAINER } from '@/shared/ui/specClasses'

export const AGENCY_ROLES = ['AGENCY', 'AGENCY_ADMIN', 'ADMIN']

/** 기획사 로그인 확인 + 승인 여부 안내. 서버가 매 요청 권한을 다시 확인한다. */
export function AgencyCastingGate({
  children,
  title,
  requireApproval = true,
}: {
  children: ReactNode
  title: string
  /** false: 승인 해제·정지 후에도 기존 제안 내역 확인·철회는 가능해야 한다. */
  requireApproval?: boolean
}) {
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
    if (!accessToken) router.replace('/login')
    else if (!AGENCY_ROLES.includes(role ?? '')) router.replace('/')
  }, [hydrated, accessToken, role, router])
  const ok = hydrated && Boolean(accessToken) && AGENCY_ROLES.includes(role ?? '')
  const quota = useQuery({ queryKey: ['agency', 'casting-quota'], queryFn: agencyCastingApi.quota, enabled: ok })

  return (
    <AgencyDashboardShell>
      <div className={`${PAGE_CONTAINER} flex flex-col gap-4 py-6`}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
          {quota.data && quota.data.approved ? (
            <p className="text-xs text-neutral-600" data-testid="casting-quota">
              오늘 보낸 제안 {quota.data.sentToday} / {quota.data.dailyLimit}
              {quota.data.restricted ? ' · 제안 제한됨' : ''}
            </p>
          ) : null}
        </div>
        {!ok ? <p className="text-sm text-neutral-600">로그인 확인 중…</p> : null}
        {ok && quota.data && !quota.data.approved ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="agency-not-approved">
            본사 승인을 받은 기획사만 인재 검색과 캐스팅 제안을 쓸 수 있습니다. 기획사 정보와 승인 상태는 설정에서 확인하세요.
          </p>
        ) : null}
        {ok && quota.data?.restricted ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            운영 정책에 따라 캐스팅 제안이 제한되었습니다.{quota.data.restrictedReason ? ` (${quota.data.restrictedReason})` : ''}
          </p>
        ) : null}
        {ok && quota.data && (quota.data.approved || !requireApproval) ? children : null}
      </div>
    </AgencyDashboardShell>
  )
}
