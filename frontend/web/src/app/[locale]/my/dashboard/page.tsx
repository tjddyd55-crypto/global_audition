'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n.config'
import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import { applicationApi } from '@/lib/api/applications'
import { userApi } from '@/lib/api/user'
import { authApi } from '@/lib/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import type { Audition } from '@/types'

export default function BusinessDashboardPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)
  const [businessId, setBusinessId] = useState<number | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authApi.getToken()
        if (!token) {
          router.push('/login')
          return
        }

        const user = await userApi.getCurrentUser()
        if (user.userType !== 'BUSINESS') {
          router.push('/')
          return
        }

        setUserType(user.userType)
        setBusinessId(user.id || null)
      } catch (err: any) {
        console.error('Auth check failed:', err)
        if (err.response?.status === 401) {
          router.push('/login')
        }
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // 내 오디션 목록 (최근 5개)
  const { data: recentAuditions } = useQuery({
    queryKey: ['myAuditions', 'dashboard'],
    queryFn: () => auditionApi.getMyAuditions({ page: 0, size: 5 }),
    enabled: userType === 'BUSINESS',
  })

  // 대시보드 통계 API 호출
  // 작업: 2026_06_frontend_stats_binding
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => auditionApi.getDashboardStats(),
    enabled: userType === 'BUSINESS',
  })

  // 통계 데이터 (API에서 가져온 값 사용)
  const totalAuditionsCount = dashboardStats?.totalAuditions || 0
  const totalApplicationsCount = dashboardStats?.totalApplicants || 0

  // 진행 중 오디션 수 (최근 5개 중에서만 계산 - 전체는 통계 API에 추가 필요)
  const ongoingAuditionsCount =
    recentAuditions?.content.filter((a: Audition) => a.status === 'ONGOING').length || 0

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (userType !== 'BUSINESS') {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">기획사 대시보드</h1>
          <p className="text-gray-600">오디션 및 지원자 현황을 한눈에 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">전체 오디션</p>
                <p className="text-3xl font-bold text-blue-600">{totalAuditionsCount}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">진행 중 오디션</p>
                <p className="text-3xl font-bold text-green-600">{ongoingAuditionsCount}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">총 지원자 수</p>
                <p className="text-3xl font-bold text-purple-600">{totalApplicationsCount}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">빠른 액션</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/auditions/create"
              className="px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center font-semibold transition-colors"
            >
              + 새 오디션 등록
            </Link>
            <Link
              href="/my/auditions"
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-semibold transition-colors"
            >
              내 오디션 관리
            </Link>
            <Link
              href="/my/profile"
              className="px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center font-semibold transition-colors"
            >
              내 정보 관리
            </Link>
          </div>
        </div>

        {/* 최근 오디션 목록 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">최근 오디션</h2>
            <Link
              href="/my/auditions"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              전체 보기 →
            </Link>
          </div>

          {recentAuditions && recentAuditions.content.length > 0 ? (
            <div className="space-y-4">
              {recentAuditions.content.map((audition: Audition) => (
                <div
                  key={audition.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{audition.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            audition.status === 'ONGOING'
                              ? 'bg-green-100 text-green-800'
                              : audition.status === 'FINISHED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {audition.status === 'ONGOING'
                            ? '진행 중'
                            : audition.status === 'FINISHED'
                            ? '종료'
                            : audition.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {audition.category} · {audition.maxRounds || 1}차 진행
                      </p>
                      <p className="text-xs text-gray-500">
                        모집 기간:{' '}
                        {new Date(audition.startDate).toLocaleDateString('ko-KR')} ~{' '}
                        {new Date(audition.endDate).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/auditions/${audition.id}/applications`}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        지원자 관리
                      </Link>
                      <Link
                        href={`/auditions/${audition.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        상세보기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">등록된 오디션이 없습니다</p>
              <Link
                href="/auditions/create"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-block"
              >
                첫 오디션 등록하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
