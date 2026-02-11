'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useQuery } from '@tanstack/react-query'
import { auditionApi, type AuditionResponse } from '../../../../lib/api/auditions'
import { applicationApi } from '../../../../lib/api/applications'
import { authApi } from '../../../../lib/api/auth'
import { videoApi } from '../../../../lib/api/videos'
import { checkBackendHealthAndVersion } from '../../../../lib/api/health'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../i18n.config'

export default function BusinessDashboardPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      router.push('/login')
      setIsCheckingAuth(false)
      return
    }
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
    if (role === 'AGENCY' || role === 'ADMIN') setUserType('BUSINESS')
    else router.push('/')
    setIsCheckingAuth(false)
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

  // Backend Health + Version (NEXT_PUBLIC_API_URL 연결 검증 — 인프라/플랫폼 종료 조건)
  const { data: backendStatus, isLoading: isHealthLoading, error: healthError } = useQuery({
    queryKey: ['backendHealthAndVersion'],
    queryFn: () => checkBackendHealthAndVersion(),
    enabled: userType === 'BUSINESS',
    refetchInterval: 30000, // 30초마다 갱신
    retry: 1,
  })

  // Media-Service API 테스트 (GET 요청만)
  const { data: videosTest, isLoading: isVideosLoading } = useQuery({
    queryKey: ['videosTest'],
    queryFn: () => videoApi.getVideos({ page: 0, size: 1 }),
    enabled: userType === 'BUSINESS',
    retry: 1,
  })

  // 통계 데이터 (API에서 가져온 값 사용)
  const totalAuditionsCount = dashboardStats?.totalAuditions || 0
  const totalApplicationsCount = dashboardStats?.totalApplicants || 0

  // 진행 중 오디션 수 (OPEN = 모집 중)
  const ongoingAuditionsCount =
    recentAuditions?.content.filter((a: AuditionResponse) => a.status === 'OPEN').length || 0

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

        {/* API 연결 상태 — Backend health/version (NEXT_PUBLIC_API_URL) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">API 연결 상태</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Backend (API)</h3>
                {isHealthLoading ? (
                  <span className="text-gray-500 text-sm">확인 중...</span>
                ) : healthError ? (
                  <span className="text-red-600 text-sm font-medium">연결 실패</span>
                ) : backendStatus?.health.ok ? (
                  <span className="text-green-600 text-sm font-medium">✓ 정상</span>
                ) : (
                  <span className="text-red-600 text-sm font-medium">✗ 오류</span>
                )}
              </div>
              {backendStatus && (
                <div className="text-xs text-gray-600 space-y-1">
                  <div>GET /api/health → <span className={backendStatus.health.ok ? 'text-green-600' : 'text-red-600'}>{backendStatus.health.ok ? 'ok' : 'fail'}</span></div>
                  <div>GET /api/version → <span className="text-gray-700">version {backendStatus.version.version}</span>{backendStatus.version.buildId !== 'n/a' ? ` · ${backendStatus.version.buildId}` : ''}</div>
                </div>
              )}
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Videos API 테스트</h3>
                {isVideosLoading ? (
                  <span className="text-gray-500 text-sm">확인 중...</span>
                ) : videosTest ? (
                  <span className="text-green-600 text-sm font-medium">✓ 정상</span>
                ) : (
                  <span className="text-red-600 text-sm font-medium">✗ 오류</span>
                )}
              </div>
              {videosTest && (
                <div className="text-xs text-gray-600">
                  API 응답: {videosTest.totalElements || 0}개 비디오 조회 성공
                </div>
              )}
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
              {recentAuditions.content.map((audition: AuditionResponse) => (
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
                            audition.status === 'OPEN'
                              ? 'bg-green-100 text-green-800'
                              : audition.status === 'CLOSED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {audition.status === 'OPEN' ? '모집 중' : audition.status === 'CLOSED' ? '종료' : '작성 중'}
                        </span>
                      </div>
                      {audition.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{audition.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        등록: {new Date(audition.createdAt).toLocaleDateString('ko-KR')}
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
