'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { useRouter, Link } from '../../../../i18n.config'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../../../lib/api/auth'
import { dashboardApi } from '../../../../lib/api/dashboard'
import { useTranslations } from 'next-intl'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'

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
    return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
  }

  if (role === 'AGENCY' || role === 'ADMIN') {
    const data = agencyQuery.data
    if (!data) return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
          <h1 className={TITLE_PAGE}>기획자/관리자 대시보드</h1>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className={CARD_BASE}>
              <div className="text-xl font-bold text-gray-900">{data.totalAuditions}</div>
              <div className={TEXT_SUB}>공고수</div>
            </div>
            <div className={CARD_BASE}>
              <div className="text-xl font-bold text-gray-900">{data.openAuditions}</div>
              <div className={TEXT_SUB}>진행중</div>
            </div>
            <div className={CARD_BASE}>
              <div className="text-xl font-bold text-gray-900">{data.totalApplications}</div>
              <div className={TEXT_SUB}>지원수</div>
            </div>
            <div className={CARD_BASE}>
              <div className="text-xl font-bold text-gray-900">{data.accepted}</div>
              <div className={TEXT_SUB}>합격</div>
            </div>
            <div className={CARD_BASE}>
              <div className="text-xl font-bold text-gray-900">{data.rejected}</div>
              <div className={TEXT_SUB}>불합격</div>
            </div>
            <div className={CARD_BASE}>
              <div className="text-xl font-bold text-gray-900">{data.pending}</div>
              <div className={TEXT_SUB}>대기</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Link href="/dashboard/auditions/create" className={BTN_PRIMARY}>
              공고 등록
            </Link>
            <Link href="/my/auditions" className={BTN_SECONDARY}>
              내 공고 관리
            </Link>
            <Link href="/credits" className={BTN_SECONDARY}>
              크레딧
            </Link>
          </div>
          <div className={CARD_BASE}>
            <h2 className={`${TITLE_PAGE} mb-4`}>최근 지원</h2>
            <ul className="flex flex-col gap-0 divide-y divide-[#E5E7EB]">
              {data.recentApplications.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{a.auditionTitle ?? a.auditionId}</p>
                    <p className={TEXT_SUB}>{a.applicantEmail ?? a.applicantId}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{statusLabel(a.status)}</span>
                </li>
              ))}
              {data.recentApplications.length === 0 && <li className={TEXT_SUB}>데이터 없음</li>}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const applicant = applicantQuery.data
  if (!applicant) return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>
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
