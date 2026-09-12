'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, Link } from '../../../../i18n.config'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/shared/api/auth'
import { dashboardApi } from '@/shared/api/dashboard'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@/shared/auth/authStore'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { applicationStatusMessageKey } from '@/shared/i18n/applicationStatusKey'

function formatLocaleDate(iso: string | undefined, locale: string): string {
  if (!iso) return ''
  const tag = locale.startsWith('ko') ? 'ko-KR' : locale.startsWith('mn') ? 'mn-MN' : 'en-US'
  return new Date(iso).toLocaleDateString(tag)
}

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode
  value: number
  label: string
  tone: 'violet' | 'blue' | 'green' | 'red' | 'pink'
}) {
  const toneBg = {
    violet: 'bg-violet-100 text-violet-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    pink: 'bg-pink-100 text-pink-700',
  }[tone]
  return (
    <div className={`${CARD_BASE} flex items-center gap-4`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${toneBg}`}>{icon}</div>
      <div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className={TEXT_SUB}>{label}</div>
      </div>
    </div>
  )
}

export default function MyDashboardPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('common')
  const tDash = useTranslations('dashboard')
  const tStatus = useTranslations('status')
  const tAgency = useTranslations('agency')
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  const [hydrated, setHydrated] = useState(false)

  const statusLabel = (status?: string) => {
    const key = applicationStatusMessageKey(status)
    if (key === 'submitted') return tDash('submittedDone')
    if (key) return tStatus(key)
    return status ?? '-'
  }

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }
    if (!accessToken && !authApi.getToken()) {
      router.push('/login')
    }
  }, [hydrated, accessToken, router])

  useEffect(() => {
    if (!hydrated) return
    if (role === 'APPLICANT') {
      router.replace('/my/applications')
    }
  }, [hydrated, role, router])

  const agencyEnabled = hydrated && (role === 'AGENCY' || role === 'ADMIN')
  const applicantEnabled = hydrated && role === 'APPLICANT'

  const agencyQuery = useQuery({
    queryKey: ['dashboard', 'agency'],
    queryFn: dashboardApi.getAgency,
    enabled: agencyEnabled,
  })

  const applicantQuery = useQuery({
    queryKey: ['dashboard', 'applicant'],
    queryFn: dashboardApi.getApplicant,
    enabled: applicantEnabled,
  })

  const dashboardLoading =
    (agencyEnabled && agencyQuery.isLoading) || (applicantEnabled && applicantQuery.isLoading)

  if (!hydrated || dashboardLoading) {
    return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
  }

  if (role === 'APPLICANT') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">
        {tDash('redirectingApplications')}
      </div>
    )
  }

  /** 백엔드 대시보드 API는 AGENCY/ADMIN·APPLICANT 전용. SUPER_ADMIN 등은 별도 허브만 표시 */
  if (role === 'SUPER_ADMIN' || role === 'USER') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
          <div>
            <h1 className={TITLE_PAGE}>
              {role === 'SUPER_ADMIN' ? tDash('superTitle') : tDash('title')}
            </h1>
            <p className={`${TEXT_SUB} mt-2`}>
              {role === 'SUPER_ADMIN' ? tDash('superHint') : tDash('userHint')}
            </p>
          </div>
          <div className={CARD_BASE}>
            <h2 className={`${TITLE_PAGE} mb-4`}>{tDash('shortcuts')}</h2>
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              {role === 'SUPER_ADMIN' && (
                <Link href="/admin/super" className={BTN_PRIMARY}>
                  {tDash('superConsole')}
                </Link>
              )}
              <Link href="/credits" className={BTN_SECONDARY}>
                {t('credits')}
              </Link>
              <Link href="/auditions" className={BTN_SECONDARY}>
                {t('auditions')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (role === 'AGENCY' || role === 'ADMIN') {
    const data = agencyQuery.data
    if (!data) return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>
    return (
      <AgencyDashboardShell>
        <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
          <h1 className={TITLE_PAGE}>{tAgency('dashboard')}</h1>
          <p className={`${TEXT_SUB} mt-2 max-w-2xl`}>{tDash('agencyHint')}</p>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <Link href="/dashboard/auditions/create" className={BTN_PRIMARY}>
              {tDash('createPosting')}
            </Link>
            <Link href="/my/auditions" className={BTN_SECONDARY}>
              {tAgency('navAuditions')}
            </Link>
            <Link href="/my/applicants" className={BTN_SECONDARY}>
              {tAgency('navApplicants')}
            </Link>
            <Link href="/my/stats" className={BTN_SECONDARY}>
              {tAgency('navStats')}
            </Link>
            <Link href="/credits" className={BTN_SECONDARY}>
              {t('credits')}
            </Link>
          </div>
          <div>
            <h2 className={`${TITLE_PAGE} mb-2`}>{tDash('recentApplications')}</h2>
            <ul className="divide-y divide-gray-200 border border-gray-200 bg-white">
              {data.recentApplications.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {a.auditionTitle ?? a.auditionId}
                    </p>
                    <p className={`${TEXT_SUB} truncate text-xs`}>{a.applicantEmail ?? a.applicantId}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {statusLabel(a.status)}
                  </span>
                </li>
              ))}
              {data.recentApplications.length === 0 && (
                <li className={`${TEXT_SUB} px-4 py-6 text-center`}>{tDash('noData')}</li>
              )}
            </ul>
          </div>
        </div>
      </AgencyDashboardShell>
    )
  }

  const applicant = applicantQuery.data
  if (!applicant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <p className="text-red-600">{t('error')}</p>
        <p className={TEXT_SUB}>{tDash('loadFailed')}</p>
        <Link href="/auditions" className={BTN_SECONDARY}>
          {tDash('goAuditions')}
        </Link>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div>
          <h1 className={TITLE_PAGE}>{tDash('applicantTitle')}</h1>
          <p className={`${TEXT_SUB} mt-2`}>{tDash('hello')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard icon={<span aria-hidden>📄</span>} value={applicant.applied} label={tDash('applied')} tone="violet" />
          <StatCard icon={<span aria-hidden>👁</span>} value={applicant.reviewed} label={tStatus('underReview')} tone="blue" />
          <StatCard icon={<span aria-hidden>✓</span>} value={applicant.accepted} label={tStatus('accepted')} tone="green" />
          <StatCard icon={<span aria-hidden>✕</span>} value={applicant.rejected} label={tStatus('rejected')} tone="red" />
          <StatCard icon={<span aria-hidden>🎬</span>} value={applicant.videosCount} label={t('videos')} tone="pink" />
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <Link href="/auditions" className={BTN_PRIMARY}>
            {tDash('browseAuditions')}
          </Link>
          <Link href="/my/applications" className={BTN_SECONDARY}>
            {tDash('myApplications')}
          </Link>
          <Link href="/credits" className={BTN_SECONDARY}>
            {t('credits')}
          </Link>
        </div>

        <div>
          <p className={`${TEXT_SUB} mb-2`}>{tDash('recentApplications')}</p>
          <div className={CARD_BASE}>
            <ul className="flex flex-col divide-y divide-[#E5E7EB]">
              {applicant.recentApplications.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/my/applications/${a.id}`} className="text-sm font-semibold text-gray-900 no-underline">
                      {a.auditionTitle ?? a.auditionId}
                    </Link>
                    <p className={TEXT_SUB}>{formatLocaleDate(a.createdAt, locale)}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{statusLabel(a.status)}</span>
                </li>
              ))}
              {applicant.recentApplications.length === 0 && <li className={`${TEXT_SUB} py-2`}>{tDash('noData')}</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
