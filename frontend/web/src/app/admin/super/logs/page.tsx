'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { superAdminApi, type AdminLogEntry } from '@/shared/api/superAdmin'

const ACTIONS = [
  '',
  'CREDIT_GRANT',
  'CREDIT_GRANT_BULK',
  'CREDIT_ADJUST',
  'CREDIT_POLICY_PATCH',
  'USER_UPDATE',
] as const

const PAGE_SIZE = 50

function targetLabel(log: AdminLogEntry): string {
  const id = log.targetId
  if (!id) return log.targetType || '—'
  return `${log.targetType} / ${id}`
}

export default function LogsPage() {
  const [adminId, setAdminId] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<AdminLogEntry | null>(null)

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const toIsoStart = (local: string) => {
    if (!local) return undefined
    const d = new Date(local)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }

  const toIsoEnd = (local: string) => {
    if (!local) return undefined
    const d = new Date(local)
    if (Number.isNaN(d.getTime())) return undefined
    d.setHours(23, 59, 59, 999)
    return d.toISOString()
  }

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['superAdmin', 'admin-logs', adminId, action, from, to, page],
    queryFn: () =>
      superAdminApi.listAdminLogs({
        adminId: adminId.trim() || undefined,
        action: action.trim() || undefined,
        from: toIsoStart(from),
        to: to ? toIsoEnd(to) : undefined,
        page,
        size: PAGE_SIZE,
      }),
  })

  const logs: AdminLogEntry[] = data?.content ?? []

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">관리자 로그</h1>

      <p className="mb-3 text-xs text-gray-500">
        API: <code className="rounded bg-gray-100 px-1">GET /api/admin/logs</code> (Spring Page) · payload는 행의「보기」로 확인
      </p>

      <div className="mb-4 rounded-lg border bg-white p-4">
        <p className="mb-3 text-sm font-medium text-gray-800">필터</p>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            admin_id
            <input
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="UUID"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            action
            <select
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              {ACTIONS.map((a) => (
                <option key={a || 'all'} value={a}>
                  {a || '(전체)'}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            기간 시작
            <input
              type="datetime-local"
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            기간 끝
            <input
              type="datetime-local"
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => setPage(0)}
          disabled={isFetching}
          className="rounded-md bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white disabled:bg-gray-300"
        >
          조회
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white p-4">
        {isLoading && <p className="text-sm text-gray-600">로딩 중…</p>}
        {error && (
          <p className="text-sm text-red-700">목록을 불러오지 못했습니다. SUPER_ADMIN·토큰을 확인하세요.</p>
        )}

        {!isLoading && !error && (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-2 font-medium">ID</th>
                <th className="py-2 pr-2 font-medium">관리자</th>
                <th className="py-2 pr-2 font-medium">액션</th>
                <th className="py-2 pr-2 font-medium">대상</th>
                <th className="py-2 pr-2 font-medium">날짜</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2 font-mono text-xs">{log.id}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{log.adminId}</td>
                  <td className="py-2 pr-2">
                    <code className="text-xs">{log.action}</code>
                  </td>
                  <td className="max-w-[200px] truncate py-2 pr-2 text-xs" title={targetLabel(log)}>
                    {targetLabel(log)}
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap text-xs text-gray-600">
                    {new Date(log.createdAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setSelected(log)}
                      className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                    >
                      보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <p className="text-sm text-gray-600">조건에 맞는 로그가 없습니다.</p>
        )}

        {!isLoading && !error && logs.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
            <span>
              총 {data?.totalElements ?? 0}건 · {data ? data.number + 1 : 1} / {Math.max(1, data?.totalPages ?? 1)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
              >
                이전
              </button>
              <button
                type="button"
                disabled={(data?.totalPages ?? 1) <= page + 1 || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg bg-white p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="log-detail-title" className="mb-2 text-lg font-semibold">
              상세 로그
            </h2>
            <p className="mb-2 text-xs text-gray-500">
              {selected.action} · {new Date(selected.createdAt).toLocaleString('ko-KR')}
            </p>
            <pre className="max-h-[50vh] overflow-auto rounded bg-gray-100 p-3 text-xs">
              {JSON.stringify(selected.payload ?? {}, null, 2)}
            </pre>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 rounded bg-[#3B82F6] px-3 py-1.5 text-sm text-white"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
