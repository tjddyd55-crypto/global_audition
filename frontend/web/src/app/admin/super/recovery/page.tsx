'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { superAdminApi, type RecoveryRequestAdminRow } from '@/shared/api/superAdmin'

function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined
    return d?.message ?? err.message ?? '요청 실패'
  }
  return '요청 실패'
}

export default function RecoveryRequestsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [issued, setIssued] = useState<{ recoveryCode: string; accountIdentifier: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['superAdmin', 'recovery-requests', status, page],
    queryFn: () =>
      superAdminApi.listRecoveryRequests({
        status: status || undefined,
        page,
        size: 50,
      }),
  })

  const rows: RecoveryRequestAdminRow[] = data?.content ?? []

  const reissueMut = useMutation({
    mutationFn: (id: string) => superAdminApi.reissueRecoveryCode(id),
    onSuccess: (res) => {
      setIssued(res)
      setActionError(null)
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'recovery-requests'] })
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'admin-logs'] })
    },
    onError: (err) => setActionError(errorMessage(err)),
  })

  const rejectMut = useMutation({
    mutationFn: (id: string) => superAdminApi.rejectRecoveryRequest(id),
    onSuccess: () => {
      setActionError(null)
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'recovery-requests'] })
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'admin-logs'] })
    },
    onError: (err) => setActionError(errorMessage(err)),
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">복구 요청</h1>
      <p className="mb-4 text-sm text-gray-600">
        관리자는 비밀번호를 임의로 지정하지 않습니다. 본인 확인 후 복구 보안 코드를 재발급하고, 평문은 이 화면에서 한 번만
        보여 줍니다.
      </p>
      <p className="mb-3 text-xs text-gray-500">
        API: <code className="rounded bg-gray-100 px-1">GET /api/admin/recovery-requests</code> ·{' '}
        <code className="rounded bg-gray-100 px-1">POST .../reissue</code> ·{' '}
        <code className="rounded bg-gray-100 px-1">POST .../reject</code>
      </p>

      {issued ? (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
          <p className="mb-2 text-sm font-medium text-violet-900">
            새 코드가 발급되었습니다. 계정 {issued.accountIdentifier} 에 안전하게 전달하세요. 이 화면을 벗어나면 다시 볼 수
            없습니다.
          </p>
          <p className="mb-3 break-all text-center font-mono text-xl font-bold tracking-wider text-violet-800">
            {issued.recoveryCode}
          </p>
          <button
            type="button"
            className="min-h-11 rounded-md border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-800"
            onClick={() => void navigator.clipboard.writeText(issued.recoveryCode)}
          >
            코드 복사
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className="min-h-11 rounded-md border px-3"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(0)
          }}
        >
          <option value="">전체</option>
          <option value="PENDING">PENDING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <span className="text-xs text-gray-500">
          {isLoading || isFetching ? '불러오는 중…' : `총 ${data?.totalElements ?? 0}건`}
        </span>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          목록을 불러오지 못했습니다. {errorMessage(error)}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">계정</th>
              <th className="px-3 py-2">요청자</th>
              <th className="px-3 py-2">연락처</th>
              <th className="px-3 py-2">메시지</th>
              <th className="px-3 py-2">요청일</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2 font-medium">{row.status}</td>
                <td className="px-3 py-2">{row.accountIdentifier}</td>
                <td className="px-3 py-2">{row.requesterName}</td>
                <td className="px-3 py-2">{row.contact}</td>
                <td className="max-w-xs truncate px-3 py-2 text-gray-600">{row.message || '—'}</td>
                <td className="px-3 py-2 text-gray-500">
                  {row.createdAt ? new Date(row.createdAt).toLocaleString('ko-KR') : '—'}
                </td>
                <td className="px-3 py-2">
                  {row.status === 'PENDING' ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="min-h-10 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white"
                        disabled={reissueMut.isPending}
                        onClick={() => {
                          if (confirm(`${row.accountIdentifier} 계정에 복구 코드를 재발급할까요?`)) {
                            reissueMut.mutate(row.id)
                          }
                        }}
                      >
                        코드 재발급
                      </button>
                      <button
                        type="button"
                        className="min-h-10 rounded-md border px-3 text-xs"
                        disabled={rejectMut.isPending}
                        onClick={() => {
                          if (confirm('이 요청을 거절할까요?')) {
                            rejectMut.mutate(row.id)
                          }
                        }}
                      >
                        거절
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">처리됨</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  복구 요청이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="min-h-10 rounded-md border px-3 text-sm disabled:opacity-40"
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          이전
        </button>
        <button
          type="button"
          className="min-h-10 rounded-md border px-3 text-sm disabled:opacity-40"
          disabled={!data || page + 1 >= (data.totalPages || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </button>
      </div>
    </div>
  )
}
