'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { superAdminApi, type PaymentOrderAdmin } from '@/shared/api/superAdmin'
import { adminError, count, envLabel, money } from '../desk'

export default function PaymentTransactionsPage() {
  const [q, setQ] = useState('')
  const [environment, setEnvironment] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const orders = useQuery({
    queryKey: ['superAdmin', 'payment-orders', q, environment, status, from, to],
    queryFn: () => superAdminApi.searchPaymentOrders({
      q: q.trim() || undefined,
      environment: environment || undefined,
      status: status || undefined,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T00:00:00`).toISOString() : undefined,
    }),
  })
  const detail = useQuery({
    queryKey: ['superAdmin', 'payment-order', selected],
    queryFn: () => superAdminApi.paymentOrderDetail(selected as string),
    enabled: Boolean(selected),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">결제 거래 내역</h1>
      <form className="flex flex-wrap items-end gap-2 text-sm" onSubmit={(event) => { event.preventDefault(); void orders.refetch() }}>
        <label className="flex flex-col gap-1">검색
          <input className="rounded border px-2 py-1" value={q} onChange={(event) => setQ(event.target.value)} placeholder="주문번호 또는 이메일" />
        </label>
        <label className="flex flex-col gap-1">환경
          <select className="rounded border px-2 py-1" value={environment} onChange={(event) => setEnvironment(event.target.value)}>
            <option value="">전체</option>
            <option value="MOCK">MOCK</option>
            <option value="TEST">TEST</option>
            <option value="LIVE">LIVE</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">상태
          <select className="rounded border px-2 py-1" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">전체</option>
            <option value="READY">READY</option>
            <option value="PAID">PAID</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">시작
          <input className="rounded border px-2 py-1" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1">종료
          <input className="rounded border px-2 py-1" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <button type="submit" className="underline">조회</button>
      </form>
      {orders.isLoading && <p>불러오는 중…</p>}
      {orders.error && <p className="text-sm text-red-700">{adminError(orders.error)}</p>}
      {orders.isSuccess && (orders.data ?? []).length === 0 && <p className="text-sm text-gray-600">결제 내역이 없습니다.</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              {['결제사', '환경', '주문번호', '사용자', '결제국가', '통화', '청구금액', '발급크레딧', '상태', '결제일', '환불'].map((label) => (
                <th key={label} className="py-2 pr-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders.data ?? []).map((row) => (
              <OrderRow key={row.orderNo} row={row} onSelect={() => setSelected(row.orderNo)} />
            ))}
          </tbody>
        </table>
      </div>
      {detail.data && (
        <section className="rounded border bg-white p-4 text-sm">
          <h2 className="text-lg font-semibold">주문 상세 {detail.data.order.orderNo}</h2>
          <p>환경 {envLabel(detail.data.order.environment)} · 결제사 {detail.data.order.providerId || detail.data.order.provider} · 수단 {detail.data.order.methodCode || '—'}</p>
          <p>환불 가능 {money(detail.data.refundableMinor, detail.data.order.chargeCurrency)} · LIVE 환불 실행 {detail.data.liveRefundAllowed ? '가능' : '불가'}</p>
          {detail.data.order.failReason && <p>실패 사유 {detail.data.order.failReason}</p>}
          <h3 className="mt-3 font-semibold">크레딧 원장</h3>
          <ul>
            {detail.data.ledger.map((line) => (
              <li key={`${line.createdAt}-${line.referenceId}-${line.type}`}>
                {line.type} {count(line.amount)} · 잔액 {count(line.afterBalance)} · {line.referenceId} · {line.createdAt}
              </li>
            ))}
            {detail.data.ledger.length === 0 && <li>원장 반영 없음</li>}
          </ul>
        </section>
      )}
      {detail.error && <p className="text-sm text-red-700">{adminError(detail.error)}</p>}
    </div>
  )
}

function OrderRow({ row, onSelect }: { row: PaymentOrderAdmin; onSelect: () => void }) {
  return (
    <tr className="border-b">
      <td className="py-2 pr-3">{row.providerId || row.provider}</td>
      <td className="py-2 pr-3">{envLabel(row.environment)}</td>
      <td className="py-2 pr-3"><button type="button" className="underline" onClick={onSelect}>{row.orderNo}</button></td>
      <td className="py-2 pr-3">{row.email}</td>
      <td className="py-2 pr-3">{row.paymentCountry || '—'}</td>
      <td className="py-2 pr-3">{row.chargeCurrency || '—'}</td>
      <td className="py-2 pr-3">{money(row.chargeAmountMinor, row.chargeCurrency)}</td>
      <td className="py-2 pr-3">{count(row.creditsIssued)}</td>
      <td className="py-2 pr-3">{row.status}</td>
      <td className="py-2 pr-3">{row.paidAt || row.createdAt}</td>
      <td className="py-2 pr-3">{row.refundState}</td>
    </tr>
  )
}
