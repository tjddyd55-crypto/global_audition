'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { superAdminApi, type PaymentOrderAdminRow } from '@/shared/api/superAdmin'
import { formatCurrency } from '@/shared/money/currency'

const PAGE_SIZE = 50

const STATUS_OPTIONS = ['', 'CREATED', 'READY', 'PAID', 'FAILED', 'CANCELLED'] as const

export default function PaymentOrdersPage() {
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['superAdmin', 'payment-orders', userId, status, page],
    queryFn: () =>
      superAdminApi.listPaymentOrders({
        userId: userId.trim() || undefined,
        status: status || undefined,
        page,
        size: PAGE_SIZE,
      }),
  })

  const rows: PaymentOrderAdminRow[] = data?.content ?? []

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">결제 주문</h1>

      <p className="mb-3 text-xs text-gray-500">
        <code className="rounded bg-gray-100 px-1">GET /api/admin/payment-orders</code> · 크레딧 지급은{' '}
        <code className="rounded bg-gray-100 px-1">credit_transactions</code> 의{' '}
        <code className="rounded bg-gray-100 px-1">referenceId = orderNo</code> 와 연계됩니다.
      </p>

      <div className="mb-4 rounded-lg border bg-white p-4">
        <p className="mb-3 text-sm font-medium text-gray-800">필터</p>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            status
            <select
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s || 'all'} value={s}>
                  {s || '전체'}
                </option>
              ))}
            </select>
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
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2 font-medium">주문번호</th>
                  <th className="py-2 pr-2 font-medium">유저</th>
                  <th className="py-2 pr-2 font-medium">상태</th>
                  <th className="py-2 pr-2 font-medium">금액</th>
                  <th className="py-2 pr-2 font-medium">크레딧</th>
                  <th className="py-2 pr-2 font-medium">보너스</th>
                  <th className="py-2 pr-2 font-medium">PG</th>
                  <th className="py-2 pr-2 font-medium">paidAt</th>
                  <th className="py-2 font-medium">생성</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100">
                    <td className="py-2 pr-2 font-mono text-xs">{o.orderNo}</td>
                    <td className="py-2 pr-2 font-mono text-xs text-gray-700">{o.userId}</td>
                    <td className="py-2 pr-2">{o.status}</td>
                    <td className="py-2 pr-2 tabular-nums">
                      {formatCurrency(Number(o.amount))} {o.currency}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">{o.credits}</td>
                    <td className="py-2 pr-2 tabular-nums">{o.bonusCredits}</td>
                    <td className="py-2 pr-2 text-xs">{o.provider}</td>
                    <td className="py-2 pr-2 whitespace-nowrap text-xs text-gray-600">
                      {o.paidAt ? new Date(o.paidAt).toLocaleString('ko-KR') : '—'}
                    </td>
                    <td className="py-2 whitespace-nowrap text-xs text-gray-600">
                      {new Date(o.createdAt).toLocaleString('ko-KR')}
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
          <p className="text-sm text-gray-600">조건에 맞는 주문이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
