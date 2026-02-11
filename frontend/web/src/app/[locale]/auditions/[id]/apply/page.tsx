'use client'

import { useParams } from 'next/navigation'
import { useRouter } from '../../../../../i18n.config'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import { applicationApi } from '@/lib/api/applications'
import { authApi } from '@/lib/api/auth'
import { Link } from '../../../../../i18n.config'
import { useTranslations } from 'next-intl'

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const auditionId = params.id as string
  const [error, setError] = useState<string | null>(null)

  const { data: audition, isLoading } = useQuery({
    queryKey: ['audition', auditionId],
    queryFn: () => auditionApi.getById(auditionId),
    enabled: !!auditionId,
  })

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(auditionId),
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['audition', auditionId] })
      router.push('/dashboard/applications')
    },
    onError: (err: any) => {
      setError(err.response?.status === 409 ? '이미 지원하셨습니다.' : (err.response?.data?.message || err.message || '지원에 실패했습니다.'))
    },
  })

  if (isLoading || !audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (audition.status !== 'OPEN') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">이 오디션은 현재 모집 중이 아닙니다.</p>
          <Link href={`/auditions/${auditionId}`} className="text-primary-600 hover:underline">
            오디션 상세로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (!authApi.getToken()) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">지원하려면 로그인해주세요.</p>
          <Link href="/login" className="text-primary-600 hover:underline">로그인</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">{audition.title} — 지원하기</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <p className="mb-6 text-gray-600">한 번만 지원할 수 있습니다. 지원하시겠습니까?</p>
        <div className="flex gap-3">
          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {applyMutation.isPending ? '처리 중...' : '지원하기'}
          </button>
          <Link href={`/auditions/${auditionId}`} className="px-6 py-2 border rounded hover:bg-gray-50">
            취소
          </Link>
        </div>
      </div>
    </div>
  )
}
