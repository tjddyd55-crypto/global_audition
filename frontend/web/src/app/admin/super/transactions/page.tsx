'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { superAdminApi, type CreditTransactionRow } from '@/lib/api/superAdmin'

const PAGE_SIZE = 50

export default function TransactionsPage() {
  const [userId, setUserId] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)

  const toIso = (local: string, endOfDay: boolean) => {
    if (!local) return undefined
    const d = new Date(local)
    if (Number.isNaN(d.getTime())) return undefined
    if (endOfDay) d.setHours(23, 59, 59, 999)
    return d.toISOString()
  }

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['superAdmin', 'credit-transactions', userId, type, from, to, page],
    queryFn: () =>
      superAdminApi.listCreditTransactions({
        userId: userId.trim() || undefined,
        type: type.trim() || undefined,
        from: toIso(from, false),
        to: to ? toIso(to, true) : undefined,
        page,
        size: PAGE_SIZE,
      }),
  })

  const rows: CreditTransactionRow[] = data?.content ?? []

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">거래 내역</h1>

      <p className="mb-3 text-xs text-gray-500">
        API: <code className="rounded bg-gray-100 px-1">GET /api/admin/credit-transactions</code> (Spring Page) · axios{' '}
        <code className="rounded bg-gray-100 px-1">withCredentials</code> + Bearer ·{' '}
        <strong>referenceId</strong>: 오디션 지원 시 오디션 UUID, 패키지 결제 충전 시 <code>orderNo</code> 등과 연계
      </p>

      <div className="mb-4 rounded-lg border bg-white p-4">
        <p className="mb-3 text-sm font-medium text-gray-800">필터</p>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            user_id (UUID)
            <input
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            type
            <input
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="CHARGE, USE, GRANT…"
            />
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
          onClick={() => {
            setPage(0)
            void refetch()
          }}
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

        {!isLoading && !error && rows.length > 0 && (
          <>
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2 font-medium">ID</th>
                  <th className="py-2 pr-2 font-medium">유저</th>
                  <th className="py-2 pr-2 font-medium">금액</th>
                  <th className="py-2 pr-2 font-medium">타입</th>
                  <th className="py-2 pr-2 font-medium">사유</th>
                  <th className="py-2 pr-2 font-medium">referenceId</th>
                  <th className="py-2 pr-2 font-medium">Before</th>
                  <th className="py-2 pr-2 font-medium">After</th>
                  <th className="py-2 font-medium">날짜</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-2 pr-2 font-mono text-xs text-gray-700">{t.id}</td>
                    <td className="py-2 pr-2 font-mono text-xs">{t.userId}</td>
                    <td
                      className={`py-2 pr-2 font-medium ${
                        t.amount > 0 ? 'text-green-600' : t.amount < 0 ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      {t.amount > 0 ? '+' : ''}
                      {t.amount}
                    </td>
                    <td className="py-2 pr-2">{t.type}</td>
                    <td className="max-w-[140px] truncate py-2 pr-2" title={t.reason}>
                      {t.reason}
                    </td>
                    <td className="max-w-[120px] truncate py-2 pr-2 font-mono text-xs text-gray-600" title={t.referenceId ?? ''}>
                      {t.referenceId ?? '—'}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">
                      {t.beforeBalance != null ? t.beforeBalance : '—'}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">
                      {t.afterBalance != null ? t.afterBalance : '—'}
                    </td>
                    <td className="py-2 whitespace-nowrap text-xs text-gray-600">
                      {new Date(t.createdAt).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
              <span>
                총 {data?.totalElements ?? 0}건 · 페이지 {data ? data.number + 1 : 1} /{' '}
                {Math.max(1, data?.totalPages ?? 1)}
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
          </>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <p className="text-sm text-gray-600">조건에 맞는 거래가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
