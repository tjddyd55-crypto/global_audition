'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import { userApi } from '@/lib/api/user'
import { authApi } from '@/lib/api/auth'
import { useTranslations } from 'next-intl'
import type { Audition } from '@/types'
import Link from 'next/link'

export default function MyAuditionsPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const queryClient = useQueryClient()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)
  const [page, setPage] = useState(0)

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

  const { data: auditions, isLoading } = useQuery({
    queryKey: ['myAuditions', page],
    queryFn: () => auditionApi.getMyAuditions({ page, size: 20 }),
    enabled: userType === 'BUSINESS',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => auditionApi.deleteAudition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAuditions'] })
    },
  })

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteMutation.mutateAsync(id)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-green-100 text-green-800'
      case 'UNDER_SCREENING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FINISHED':
        return 'bg-gray-100 text-gray-800'
      case 'WAITING_OPENING':
        return 'bg-blue-100 text-blue-800'
      case 'WRITING':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return '진행 중'
      case 'UNDER_SCREENING':
        return '심사 중'
      case 'FINISHED':
        return '종료'
      case 'WAITING_OPENING':
        return '오픈 대기'
      case 'WRITING':
        return '작성 중'
      default:
        return status
    }
  }

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">내 오디션 관리</h1>
          <Link
            href="/auditions/create"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + 오디션 등록
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">{t('loading')}</div>
          </div>
        ) : auditions && auditions.content.length > 0 ? (
          <div className="space-y-4">
            {auditions.content.map((audition: Audition) => (
              <div
                key={audition.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{audition.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          audition.status
                        )}`}
                      >
                        {getStatusText(audition.status)}
                      </span>
                    </div>
                    {audition.titleEn && (
                      <p className="text-gray-600 mb-2">{audition.titleEn}</p>
                    )}
                    {audition.description && (
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {audition.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>카테고리: {audition.category}</span>
                      <span>
                        모집 기간: {new Date(audition.startDate).toLocaleDateString()} ~{' '}
                        {new Date(audition.endDate).toLocaleDateString()}
                      </span>
                      {audition.screeningDate1 && (
                        <span>
                          1차 심사: {new Date(audition.screeningDate1).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/auditions/${audition.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      상세보기
                    </Link>
                    <Link
                      href={`/auditions/${audition.id}/applications`}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      지원자 관리
                    </Link>
                    <button
                      onClick={() => handleDelete(audition.id!)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      disabled={deleteMutation.isPending}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 페이지네이션 */}
            {auditions.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {page + 1} / {auditions.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(auditions.totalPages - 1, p + 1))}
                  disabled={page >= auditions.totalPages - 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">등록된 오디션이 없습니다</p>
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
  )
}
