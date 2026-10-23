'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi } from '@/shared/api/superAdmin'
import { adminError, count, envLabel, money } from '../desk'

export default function PaymentRefundsPage() {
  const qc = useQueryClient()
  const refunds = useQuery({
    queryKey: ['superAdmin', 'payment-refunds'],
    queryFn: () => superAdminApi.listPaymentRefunds(),
  })
  const orders = useQuery({
    queryKey: ['superAdmin', 'payment-orders', 'refundable'],
    queryFn: () => superAdminApi.searchPaymentOrders({}),
  })
  const audits = useQuery({
    queryKey: ['superAdmin', 'payment-audits'],
    queryFn: () => superAdminApi.listPaymentAudits(),
  })
  const [orderNo, setOrderNo] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const selected = (orders.data ?? []).find((row) => row.orderNo === orderNo) ?? null
  const live = selected?.environment === 'LIVE'
  const refund = useMutation({
    mutationFn: () => superAdminApi.refundPaymentOrder(orderNo, {
      amountMinor: Number(amount),
      idempotencyKey: crypto.randomUUID(),
    }),
    onSuccess: async () => {
      setMessage('환불 처리 결과를 원장과 목록에 반영했습니다.')
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'payment-refunds'] })
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'payment-audits'] })
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'payment-orders'] })
    },
    onError: (error) => setMessage(adminError(error)),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">환불 관리</h1>
      <p className="text-sm text-gray-600">TEST와 LIVE를 구분해 표시합니다. LIVE 환불은 이 화면에서 실행할 수 없습니다.</p>
      <form className="flex flex-wrap items-end gap-2 text-sm" onSubmit={(event) => { event.preventDefault(); setMessage(null); refund.mutate() }}>
        <label className="flex flex-col gap-1">원거래
          <select className="rounded border px-2 py-1" value={orderNo} onChange={(event) => setOrderNo(event.target.value)}>
            <option value="">선택</option>
            {(orders.data ?? []).map((row) => (
              <option key={row.orderNo} value={row.orderNo}>
                {envLabel(row.environment)} · {row.orderNo} · {row.email}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">환불 금액(minor)
          <input className="rounded border px-2 py-1" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <button type="submit" className="underline" disabled={!selected || live || !amount || refund.isPending}>
          {live ? 'LIVE 환불 실행 불가' : '환불 처리'}
        </button>
      </form>
      {selected && (
        <p className="text-sm">
          환경 {envLabel(selected.environment)} · 청구 {money(selected.chargeAmountMinor, selected.chargeCurrency)} · 누적 환불 {money(selected.refundedMinor, selected.chargeCurrency)} · 상태 {selected.refundState} · 발급 {count(selected.creditsIssued)}
        </p>
      )}
      {message && <p className="text-sm">{message}</p>}
      <h2 className="text-lg font-semibold">요청 내역</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              {['환경', '원거래', '사용자', '결제사', '구분', '이번 금액', '크레딧', '주문 상태', '처리 시각'].map((label) => (
                <th key={label} className="py-2 pr-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(refunds.data ?? []).map((row) => {
              const full = row.chargeAmountMinor != null && row.amountMinor >= row.chargeAmountMinor
              return (
                <tr key={row.id} className="border-b">
                  <td className="py-2 pr-3">{envLabel(row.environment)}</td>
                  <td className="py-2 pr-3">{row.orderNo}</td>
                  <td className="py-2 pr-3">{row.email}</td>
                  <td className="py-2 pr-3">{row.providerId || '—'}</td>
                  <td className="py-2 pr-3">{full ? '전체' : '부분'}</td>
                  <td className="py-2 pr-3">{money(row.amountMinor, row.chargeCurrency)}</td>
                  <td className="py-2 pr-3">{count(row.credits)}</td>
                  <td className="py-2 pr-3">{row.orderStatus}</td>
                  <td className="py-2 pr-3">{row.createdAt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {refunds.error && <p className="text-sm text-red-700">{adminError(refunds.error)}</p>}
      <h2 className="text-lg font-semibold">관리자 처리 이력</h2>
      <ul className="text-sm">
        {(audits.data ?? []).filter((row) => row.summary.includes('refund=') || row.summary.includes('mockTest=') || row.summary.includes('reprocess=') || row.summary.includes('rotated=')).map((row) => (
          <li key={row.id}>{row.createdAt} · {row.targetId} · {row.summary}</li>
        ))}
      </ul>
    </div>
  )
}
