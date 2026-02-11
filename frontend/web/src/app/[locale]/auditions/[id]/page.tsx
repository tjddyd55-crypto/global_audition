'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '../../../../lib/api/auditions'
import { applicationApi } from '../../../../lib/api/applications'
import { authApi } from '../../../../lib/api/auth'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '../../../../i18n.config'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function AuditionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const id = params.id as string
  const [applyError, setApplyError] = useState<string | null>(null)
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(id),
    onSuccess: () => {
      setApplyError(null)
      queryClient.invalidateQueries({ queryKey: ['audition', id] })
      router.push('/my/dashboard')
    },
    onError: (err: any) => {
      const msg = err.response?.status === 409
        ? '이미 지원하셨습니다.'
        : (err.response?.data?.message || err.message || '지원에 실패했습니다.')
      setApplyError(msg)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{t('error')}</div>
      </div>
    )
  }

  const canApply = audition.status === 'OPEN' && (role === 'APPLICANT' || role === 'ADMIN')
  const isOwner = role === 'AGENCY' || role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{audition.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-block px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {audition.status === 'DRAFT' ? '초안' : audition.status === 'OPEN' ? '모집중' : '마감'}
            </span>
          </div>
          {audition.description && (
            <div className="text-gray-700 whitespace-pre-line mb-6">{audition.description}</div>
          )}
          <p className="text-sm text-gray-500">
            등록일: {format(new Date(audition.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
          </p>
        </div>

        {applyError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {applyError}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
          {canApply && authApi.getToken() && (
            <>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="inline-block px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-lg font-semibold"
              >
                {applyMutation.isPending ? '처리 중...' : '지원하기'}
              </button>
              <p className="text-sm text-gray-500 mt-4">한 번만 지원할 수 있습니다</p>
            </>
          )}
          {isOwner && authApi.getToken() && (
            <Link
              href={`/auditions/${id}/applications`}
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              지원자 목록 / 합격 처리
            </Link>
          )}
          {!authApi.getToken() && (
            <p className="text-gray-500">
              <Link href="/login" className="text-primary-600 hover:underline">로그인</Link> 후 지원할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
