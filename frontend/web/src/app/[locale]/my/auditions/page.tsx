'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditionApi, type AuditionResponse } from '../../../../lib/api/auditions'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../i18n.config'
import { toast } from 'sonner'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { useAuthStore } from '@/lib/auth/authStore'
import type { AuditionStatus } from '@/lib/types/audition'
import { PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'

export default function MyAuditionsPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  const [gateReady, setGateReady] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setGateReady(true)
  }, [])

  useEffect(() => {
    if (!gateReady) return
    if (!accessToken) {
      router.push('/login')
      return
    }
    if (role !== 'AGENCY' && role !== 'ADMIN') {
      router.push('/')
    }
  }, [accessToken, gateReady, role, router])

  const { data: auditions, isLoading } = useQuery({
    queryKey: ['myAuditions', page],
    queryFn: () => auditionApi.getMyAuditions({ page, size: 20 }),
    enabled: gateReady && (role === 'AGENCY' || role === 'ADMIN'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => auditionApi.deleteAudition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAuditions'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AuditionStatus }) => auditionApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAuditions'] })
      toast.success('상태가 변경되었습니다.')
    },
    onError: () => toast.error('상태 변경에 실패했습니다.'),
  })

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      alert(msg ?? '삭제는 현재 지원되지 않습니다.')
    }
  }

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'OPEN':
        return '모집 중'
      case 'CLOSED':
        return '마감'
      case 'DRAFT':
        return '작성 중'
      default:
        return status
    }
  }, [])

  if (!gateReady || role === null) {
    return (
      <AgencyDashboardShell>
        <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
      </AgencyDashboardShell>
    )
  }

  if (role !== 'AGENCY' && role !== 'ADMIN') {
    return null
  }

  return (
    <AgencyDashboardShell>
      <div className={`${PAGE_CONTAINER} py-6`}>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">오디션 관리</h1>
            <p className={`${TEXT_SUB} mt-1 text-sm`}>공고 목록 · 지원자 처리는 지원자 관리 메뉴에서 합니다.</p>
          </div>
          <Link
            href="/dashboard/auditions/create"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-violet-700"
          >
            + 오디션 등록
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">{t('loading')}</div>
        ) : auditions && auditions.content.length > 0 ? (
          <>
            <div className="mt-4 hidden border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 md:grid md:grid-cols-12 md:gap-2">
              <div className="col-span-4">제목</div>
              <div className="col-span-2">상태</div>
              <div className="col-span-2 text-right">지원자</div>
              <div className="col-span-4 text-right">관리</div>
            </div>
            <ul className="divide-y divide-gray-200 border border-t-0 border-gray-200 bg-white">
              {auditions.content.map((audition: AuditionResponse) => (
                <li key={audition.id} className="px-3 py-4 md:grid md:grid-cols-12 md:items-center md:gap-2 md:py-3">
                  <div className="md:col-span-4">
                    <p className="font-medium text-gray-900">{audition.title}</p>
                    <p className={`${TEXT_SUB} text-xs md:hidden`}>
                      {getStatusText(audition.status)} · 지-{audition.applicantsCount ?? 0}명
                    </p>
                  </div>
                  <div className="mt-2 hidden text-sm text-gray-800 md:col-span-2 md:mt-0 md:block">
                    {getStatusText(audition.status)}
                  </div>
                  <div className="hidden text-right text-sm tabular-nums text-gray-800 md:col-span-2 md:block">
                    {(audition.applicantsCount ?? 0).toLocaleString('ko-KR')}명
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 md:col-span-4 md:mt-0">
                    {audition.status === 'OPEN' || audition.status === 'CLOSED' ? (
                      <button
                        type="button"
                        disabled={statusMutation.isPending}
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => {
                          const next: AuditionStatus = audition.status === 'OPEN' ? 'CLOSED' : 'OPEN'
                          if (confirm(next === 'OPEN' ? '공고를 모집 중(OPEN)으로 바꿀까요?' : '공고를 마감(CLOSED) 처리할까요?')) {
                            statusMutation.mutate({ id: audition.id, status: next })
                          }
                        }}
                      >
                        {audition.status === 'OPEN' ? '마감 처리' : '다시 모집(OPEN)'}
                      </button>
                    ) : null}
                    <Link
                      href={`/my/applicants?auditionId=${encodeURIComponent(audition.id)}`}
                      className="rounded bg-gray-900 px-2 py-1 text-xs font-semibold text-white no-underline hover:bg-gray-800"
                    >
                      지원자 관리
                    </Link>
                    <Link
                      href={`/auditions/${audition.id}/edit`}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 no-underline hover:bg-gray-50"
                    >
                      수정
                    </Link>
                    <Link
                      href={`/auditions/${audition.id}`}
                      className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-violet-700 no-underline hover:bg-violet-50"
                    >
                      공개 상세
                    </Link>
                    <button
                      type="button"
                      className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(audition.id)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {auditions.totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm">
                  {page + 1} / {auditions.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(auditions.totalPages - 1, p + 1))}
                  disabled={page >= auditions.totalPages - 1}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-600">등록된 오디션이 없습니다.</p>
            <Link
              href="/dashboard/auditions/create"
              className="mt-4 inline-block text-sm font-semibold text-violet-700 no-underline"
            >
              첫 오디션 등록하기 →
            </Link>
          </div>
        )}
      </div>
    </AgencyDashboardShell>
  )
}
