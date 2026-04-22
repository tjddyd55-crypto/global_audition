'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, Link } from '../../../../i18n.config'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/shared/api/auth'
import { dashboardApi } from '@/shared/api/dashboard'
import { useTranslations } from 'next-intl'
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

function statusLabel(status?: string) {
  if (status === 'ACCEPTED') return '합격'
  if (status === 'REJECTED') return '불합격'
  if (status === 'REVIEWING' || status === 'REVIEWED') return '검토중'
  if (status === 'SUBMITTED') return '제출완료'
  return status ?? '-'
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
  const t = useTranslations('common')
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  const [hydrated, setHydrated] = useState(false)

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
        내 지원으로 이동 중…
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
              {role === 'SUPER_ADMIN' ? '슈퍼관리자' : '내 대시보드'}
            </h1>
            <p className={`${TEXT_SUB} mt-2`}>
              {role === 'SUPER_ADMIN'
                ? '플랫폼 운영 메뉴로 이동하거나 크레딧을 관리할 수 있습니다.'
                : '일반 계정입니다. 서비스 메뉴를 이용해 주세요.'}
            </p>
          </div>
          <div className={CARD_BASE}>
            <h2 className={`${TITLE_PAGE} mb-4`}>바로가기</h2>
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              {role === 'SUPER_ADMIN' && (
                <Link href="/admin/super" className={BTN_PRIMARY}>
                  슈퍼관리자 콘솔
                </Link>
              )}
              <Link href="/credits" className={BTN_SECONDARY}>
                크레딧
              </Link>
              <Link href="/auditions" className={BTN_SECONDARY}>
                오디션
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
          <h1 className={TITLE_PAGE}>기획사 대시보드</h1>
          <p className={`${TEXT_SUB} mt-2 max-w-2xl`}>
            공고·지원자 처리는 상단 메뉴에서 이동할 수 있습니다. 숫자 요약은 통계 메뉴에서 확인하세요.
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <Link href="/dashboard/auditions/create" className={BTN_PRIMARY}>
              공고 등록
            </Link>
            <Link href="/my/auditions" className={BTN_SECONDARY}>
              오디션 관리
            </Link>
            <Link href="/my/applicants" className={BTN_SECONDARY}>
              지원자 관리
            </Link>
            <Link href="/my/stats" className={BTN_SECONDARY}>
              통계
            </Link>
            <Link href="/credits" className={BTN_SECONDARY}>
              크레딧
            </Link>
          </div>
          <div>
            <h2 className={`${TITLE_PAGE} mb-2`}>최근 지원</h2>
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
                <li className={`${TEXT_SUB} px-4 py-6 text-center`}>데이터 없음</li>
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
        <p className={TEXT_SUB}>대시보드 데이터를 불러오지 못했습니다. 다시 로그인하거나 잠시 후 시도해 주세요.</p>
        <Link href="/auditions" className={BTN_SECONDARY}>
          오디션으로 이동
        </Link>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div>
          <h1 className={TITLE_PAGE}>지원자 대시보드</h1>
          <p className={`${TEXT_SUB} mt-2`}>안녕하세요! 👋</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard icon={<span aria-hidden>📄</span>} value={applicant.applied} label="지원" tone="violet" />
          <StatCard icon={<span aria-hidden>👁</span>} value={applicant.reviewed} label="검토중" tone="blue" />
          <StatCard icon={<span aria-hidden>✓</span>} value={applicant.accepted} label="합격" tone="green" />
          <StatCard icon={<span aria-hidden>✕</span>} value={applicant.rejected} label="불합격" tone="red" />
          <StatCard icon={<span aria-hidden>🎬</span>} value={applicant.videosCount} label="영상" tone="pink" />
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <Link href="/auditions" className={BTN_PRIMARY}>
            오디션 보기
          </Link>
          <Link href="/my/applications" className={BTN_SECONDARY}>
            내 지원서
          </Link>
          <Link href="/credits" className={BTN_SECONDARY}>
            크레딧
          </Link>
        </div>

        <div>
          <p className={`${TEXT_SUB} mb-2`}>최근 지원</p>
          <div className={CARD_BASE}>
            <ul className="flex flex-col divide-y divide-[#E5E7EB]">
              {applicant.recentApplications.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/my/applications/${a.id}`} className="text-sm font-semibold text-gray-900 no-underline">
                      {a.auditionTitle ?? a.auditionId}
                    </Link>
                    <p className={TEXT_SUB}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString('ko-KR') : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{statusLabel(a.status)}</span>
                </li>
              ))}
              {applicant.recentApplications.length === 0 && <li className={`${TEXT_SUB} py-2`}>데이터 없음</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
