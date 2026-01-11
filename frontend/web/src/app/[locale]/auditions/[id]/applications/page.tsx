'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRouter as useI18nRouter } from '@/i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationApi } from '@/lib/api/applications'
import { auditionApi } from '@/lib/api/auditions'
import { userApi } from '@/lib/api/user'
import { authApi } from '@/lib/api/auth'
import { useTranslations } from 'next-intl'
import type { Application, Audition, ScreeningResult } from '@/types'
import Link from 'next/link'

export default function ApplicationsManagementPage() {
  const params = useParams<{ id: string; locale: string }>()
  const router = useRouter()
  const i18nRouter = useI18nRouter()
  const t = useTranslations('common')
  const queryClient = useQueryClient()
  const auditionId = Number(params.id)

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)
  const [selectedStage, setSelectedStage] = useState<number | null>(null) // null=전체, 0=지원, 1=1차합격, 2=2차합격, 3=최종합격
  const [page, setPage] = useState(0)
  const [selectedApplications, setSelectedApplications] = useState<number[]>([])

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

  // 오디션 정보 조회
  const { data: audition, isLoading: isAuditionLoading } = useQuery({
    queryKey: ['audition', auditionId],
    queryFn: () => auditionApi.getAudition(auditionId),
    enabled: !!auditionId,
  })

  // 지원자 목록 조회
  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: ['applications', auditionId, selectedStage, page],
    queryFn: () =>
      applicationApi.getApplicationsByAudition(auditionId, {
        stage: selectedStage ?? undefined,
        page,
        size: 20,
      }),
    enabled: userType === 'BUSINESS' && !!auditionId,
  })

  // 합격 처리 mutation
  const passMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: number }) =>
      applicationApi.passApplication(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', auditionId] })
      setSelectedApplications([])
    },
  })

  // 불합격 처리 mutation
  const failMutation = useMutation({
    mutationFn: (id: number) => applicationApi.failApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', auditionId] })
      setSelectedApplications([])
    },
  })

  const handlePass = async (id: number, stage: number) => {
    if (!confirm(`${stage}차 합격 처리하시겠습니까?`)) return
    await passMutation.mutateAsync({ id, stage })
  }

  const handleFail = async (id: number) => {
    if (!confirm('불합격 처리하시겠습니까?')) return
    await failMutation.mutateAsync(id)
  }

  const handleBulkPass = async () => {
    if (selectedApplications.length === 0) {
      alert('선택된 지원자가 없습니다')
      return
    }

    // 선택된 모든 지원자의 currentStage 확인
    const selectedApps = applications?.content.filter((app) =>
      selectedApplications.includes(app.id)
    ) || []
    
    if (selectedApps.length === 0) {
      alert('선택된 지원자를 찾을 수 없습니다')
      return
    }

    // 모든 지원자가 다음 단계로 진행 가능한지 확인
    const nextStages = selectedApps.map((app) => getNextStage(app.currentStage))
    const validNextStages = nextStages.filter((stage) => stage !== null) as number[]
    
    if (validNextStages.length === 0) {
      alert('선택된 지원자 중 다음 단계로 진행할 수 있는 지원자가 없습니다')
      return
    }

    // 모든 지원자가 같은 다음 단계를 가지고 있는지 확인
    const uniqueNextStages = [...new Set(validNextStages)]
    if (uniqueNextStages.length > 1) {
      alert(
        `선택된 지원자들의 현재 단계가 다릅니다.\n각 지원자별로 개별 처리해주세요.`
      )
      return
    }

    const stage = uniqueNextStages[0]
    if (!confirm(`선택된 ${selectedApplications.length}명을 ${stage}차 합격 처리하시겠습니까?`))
      return

    try {
      await Promise.all(
        selectedApplications.map((id) => passMutation.mutateAsync({ id, stage }))
      )
      setSelectedApplications([])
    } catch (error) {
      console.error('Bulk pass failed:', error)
      alert('일괄 합격 처리 중 오류가 발생했습니다')
    }
  }

  const handleBulkFail = async () => {
    if (selectedApplications.length === 0) {
      alert('선택된 지원자가 없습니다')
      return
    }
    if (!confirm(`선택된 ${selectedApplications.length}명을 불합격 처리하시겠습니까?`)) return

    try {
      await Promise.all(selectedApplications.map((id) => failMutation.mutateAsync(id)))
      setSelectedApplications([])
    } catch (error) {
      console.error('Bulk fail failed:', error)
    }
  }

  const toggleApplicationSelection = (id: number) => {
    setSelectedApplications((prev) =>
      prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]
    )
  }

  const getStageText = (stage: number | undefined) => {
    if (stage === undefined || stage === null) return '지원'
    switch (stage) {
      case 0:
        return '지원'
      case 1:
        return '1차 합격'
      case 2:
        return '2차 합격'
      case 3:
        return '최종 합격'
      default:
        return '지원'
    }
  }

  const getResultBadgeColor = (result: ScreeningResult | undefined) => {
    if (!result) return 'bg-gray-100 text-gray-800'
    switch (result) {
      case 'PASS':
        return 'bg-green-100 text-green-800'
      case 'FAIL':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getNextStage = (currentStage: number | undefined): number | null => {
    if (!audition?.maxRounds) return null
    if (currentStage === undefined || currentStage === null) return 1
    if (currentStage >= audition.maxRounds) return null
    return currentStage + 1
  }

  if (isCheckingAuth || isAuditionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (userType !== 'BUSINESS') {
    return null
  }

  if (!audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">오디션을 찾을 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/my/auditions"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← 내 오디션 목록
              </Link>
              <h1 className="text-3xl font-bold">{audition.title} - 지원자 관리</h1>
              <p className="text-gray-600 mt-2">
                최대 {audition.maxRounds || 1}차 진행 · 총{' '}
                {applications?.totalElements || 0}명 지원
              </p>
            </div>
            <Link
              href={`/auditions/${auditionId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              오디션 수정
            </Link>
          </div>
        </div>

        {/* 필터 및 일괄 처리 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStage(null)}
                className={`px-4 py-2 rounded-lg ${
                  selectedStage === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setSelectedStage(0)}
                className={`px-4 py-2 rounded-lg ${
                  selectedStage === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                지원
              </button>
              {(audition.maxRounds ?? 0) >= 1 && (
                <button
                  onClick={() => setSelectedStage(1)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedStage === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  1차 합격
                </button>
              )}
              {(audition.maxRounds ?? 0) >= 2 && (
                <button
                  onClick={() => setSelectedStage(2)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedStage === 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  2차 합격
                </button>
              )}
              {(audition.maxRounds ?? 0) >= 3 && (
                <button
                  onClick={() => setSelectedStage(3)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedStage === 3
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  3차 합격
                </button>
              )}
            </div>

            {selectedApplications.length > 0 && (
              <div className="flex gap-2 ml-auto">
                <span className="px-4 py-2 text-sm text-gray-600">
                  {selectedApplications.length}명 선택됨
                </span>
                {(() => {
                  const selectedApps =
                    applications?.content.filter((app) =>
                      selectedApplications.includes(app.id)
                    ) || []
                  const nextStages = selectedApps
                    .map((app) => getNextStage(app.currentStage))
                    .filter((stage) => stage !== null) as number[]
                  const uniqueNextStages = [...new Set(nextStages)]
                  
                  if (uniqueNextStages.length === 1 && uniqueNextStages[0]) {
                    return (
                      <button
                        onClick={handleBulkPass}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        일괄 합격 ({uniqueNextStages[0]}차)
                      </button>
                    )
                  }
                  return null
                })()}
                <button
                  onClick={handleBulkFail}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  일괄 불합격
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 지원자 목록 */}
        {isApplicationsLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">{t('loading')}</div>
          </div>
        ) : applications && applications.content.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedApplications.length === applications.content.length &&
                          applications.content.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(applications.content.map((app) => app.id))
                          } else {
                            setSelectedApplications([])
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">현재 단계</th>
                    <th className="px-4 py-3 text-left">1차</th>
                    <th className="px-4 py-3 text-left">2차</th>
                    <th className="px-4 py-3 text-left">3차</th>
                    <th className="px-4 py-3 text-left">최종</th>
                    <th className="px-4 py-3 text-left">지원일</th>
                    <th className="px-4 py-3 text-left">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.content.map((app: Application) => {
                    const nextStage = getNextStage(app.currentStage)
                    return (
                      <tr key={app.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(app.id)}
                            onChange={() => toggleApplicationSelection(app.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{app.userName || `사용자 ${app.userId}`}</div>
                            <div className="text-sm text-gray-500">ID: {app.userId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {getStageText(app.currentStage)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {app.result1 && (
                            <span
                              className={`px-2 py-1 rounded text-xs ${getResultBadgeColor(
                                app.result1
                              )}`}
                            >
                              {app.result1}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {app.result2 && (
                            <span
                              className={`px-2 py-1 rounded text-xs ${getResultBadgeColor(
                                app.result2
                              )}`}
                            >
                              {app.result2}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {app.result3 && (
                            <span
                              className={`px-2 py-1 rounded text-xs ${getResultBadgeColor(
                                app.result3
                              )}`}
                            >
                              {app.result3}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {app.finalResult && (
                            <span
                              className={`px-2 py-1 rounded text-xs ${getResultBadgeColor(
                                app.finalResult
                              )}`}
                            >
                              {app.finalResult}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/applications/${app.id}`}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            >
                              상세
                            </Link>
                            {nextStage && (
                              <button
                                onClick={() => handlePass(app.id, nextStage)}
                                disabled={passMutation.isPending}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs disabled:opacity-50"
                              >
                                {nextStage}차 합격
                              </button>
                            )}
                            {app.currentStage !== undefined && app.currentStage !== null && (
                              <button
                                onClick={() => handleFail(app.id)}
                                disabled={failMutation.isPending}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs disabled:opacity-50"
                              >
                                불합격
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {applications.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {page + 1} / {applications.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(applications.totalPages - 1, p + 1))}
                  disabled={page >= applications.totalPages - 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {selectedStage === null
                ? '지원자가 없습니다'
                : `${getStageText(selectedStage)} 지원자가 없습니다`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
