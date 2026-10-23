'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditionApi, type AuditionResponse } from '@/shared/api/auditions'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../i18n.config'
import { toast } from 'sonner'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'
import { useAuthStore } from '@/shared/auth/authStore'
import type { AuditionStatus } from '@/shared/types/audition'
import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'

export default function MyAuditionsPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const tMine = useTranslations('myAuditions')
  const tAgency = useTranslations('agency')
  const tStatus = useTranslations('status')
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
      toast.success(tAgency('statusChanged'))
    },
    onError: () => toast.error(tAgency('statusFailed')),
  })

  const handleDelete = async (id: string) => {
    if (!confirm(tMine('confirmDelete'))) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      alert(msg ?? tMine('deleteUnsupported'))
    }
  }

  const getStatusText = useCallback(
    (status: string) => {
      if (status === 'OPEN') return tStatus('open')
      if (status === 'CLOSED') return tStatus('closed')
      if (status === 'DRAFT') return tMine('statusWriting')
      return status
    },
    [tMine, tStatus],
  )

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
            <h1 className="text-xl font-semibold text-gray-900">{tMine('title')}</h1>
            <p className={`${TEXT_SUB} mt-1 text-sm`}>{tMine('hint')}</p>
          </div>
          <Link
            href="/dashboard/auditions/create"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-violet-700"
          >
            {tMine('create')}
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">{t('loading')}</div>
        ) : auditions && auditions.content.length > 0 ? (
          <>
            <div className="mt-4 hidden border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 md:grid md:grid-cols-12 md:gap-2">
              <div className="col-span-4">{tMine('colTitle')}</div>
              <div className="col-span-2">{tMine('colStatus')}</div>
              <div className="col-span-6 text-right">{tMine('colManage')}</div>
            </div>
            <ul className="divide-y divide-gray-200 border border-t-0 border-gray-200 bg-white">
              {auditions.content.map((audition: AuditionResponse) => (
                <li key={audition.id} className="px-3 py-4 md:grid md:grid-cols-12 md:items-center md:gap-2 md:py-3">
                  <div className="md:col-span-4">
                    <p className="font-medium text-gray-900">{audition.title}</p>
                    <p className={`${TEXT_SUB} text-xs md:hidden`}>{getStatusText(audition.status)}</p>
                  </div>
                  <div className="mt-2 hidden text-sm text-gray-800 md:col-span-2 md:mt-0 md:block">
                    {getStatusText(audition.status)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 md:col-span-6 md:mt-0">
                    {audition.status === 'OPEN' || audition.status === 'CLOSED' ? (
                      <button
                        type="button"
                        disabled={statusMutation.isPending}
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => {
                          const next: AuditionStatus = audition.status === 'OPEN' ? 'CLOSED' : 'OPEN'
                          if (confirm(next === 'OPEN' ? tMine('confirmOpen') : tMine('confirmClose'))) {
                            statusMutation.mutate({ id: audition.id, status: next })
                          }
                        }}
                      >
                        {audition.status === 'OPEN' ? tMine('closeAction') : tMine('reopenAction')}
                      </button>
                    ) : null}
                    <Link
                      href={`/my/applicants?auditionId=${encodeURIComponent(audition.id)}`}
                      className="rounded bg-gray-900 px-2 py-1 text-xs font-semibold text-white no-underline hover:bg-gray-800"
                    >
                      {tAgency('navApplicants')}
                    </Link>
                    <Link
                      href={`/auditions/${audition.id}/edit`}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 no-underline hover:bg-gray-50"
                    >
                      {t('edit')}
                    </Link>
                    <Link
                      href={`/auditions/${audition.id}`}
                      className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-violet-700 no-underline hover:bg-violet-50"
                    >
                      {tMine('publicDetail')}
                    </Link>
                    <button
                      type="button"
                      className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(audition.id)}
                    >
                      {t('delete')}
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
                  {t('previous')}
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
                  {t('next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-600">{tMine('empty')}</p>
            <Link
              href="/dashboard/auditions/create"
              className="mt-4 inline-block text-sm font-semibold text-violet-700 no-underline"
            >
              {tMine('createFirst')}
            </Link>
          </div>
        )}
      </div>
    </AgencyDashboardShell>
  )
}
