'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminKo } from '@/app/admin/org/copy'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'
import { formatCount } from '@/shared/money/currency'

export default function ContractsPage() {
  const qc = useQueryClient()
  const [country, setCountry] = useState('')
  const [number, setNumber] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [currency, setCurrency] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [rate, setRate] = useState('')
  const [basis, setBasis] = useState('')
  const [rounding, setRounding] = useState('')
  const [refundBasis, setRefundBasis] = useState('')
  const [feeBasis, setFeeBasis] = useState('')
  const [extraBasis, setExtraBasis] = useState('')
  const [error, setError] = useState<string | null>(null)
  const contracts = useQuery({
    queryKey: ['org', 'contracts', country],
    queryFn: () => orgAdminApi.contracts(country),
    enabled: country.trim().length === 2,
  })
  const create = useMutation({
    mutationFn: () =>
      orgAdminApi.createContract({
        contractNumber: number,
        countryCode: country,
        counterpartyName: counterparty,
        startDate: start,
        payoutCurrency: currency,
        endDate: end || null,
        revenueShareBps: rate.trim() === '' ? null : Number(rate),
        settlementBasis: basis.trim() === '' ? null : basis.trim(),
        roundingPolicy: rounding.trim() === '' ? null : rounding.trim(),
        refundDeductionBasis: refundBasis.trim() === '' ? null : refundBasis.trim(),
        paymentFeeDeductionBasis: feeBasis.trim() === '' ? null : feeBasis.trim(),
        extraDeductionBasis: extraBasis.trim() === '' ? null : extraBasis.trim(),
        paymentFeeUsd: feeBasis === 'FIXED_USD' ? 0 : null,
        extraDeductionUsd: extraBasis === 'FIXED_USD' ? 0 : null,
      }),
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['org', 'contracts', country] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{adminKo.contracts}</h1>
      <p className="mb-4 text-sm text-gray-600">{adminKo.rateUnset}</p>
      <div className="mb-6 grid max-w-xl gap-2">
        <input className="rounded border px-3 py-2" aria-label="계약 국가" placeholder="국가 코드" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} />
        <input className="rounded border px-3 py-2" aria-label="계약 번호" placeholder="계약 번호" value={number} onChange={(e) => setNumber(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="계약 상대" placeholder="계약 상대" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="지급 통화" placeholder="지급 통화 (필수)" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="시작일" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="종료일" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="요율 bps" placeholder="요율 bps (비우면 미정)" value={rate} onChange={(e) => setRate(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="정산 기준" placeholder="정산 기준 PAID_USAGE_LINKED_TO_CASH" value={basis} onChange={(e) => setBasis(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="반올림" placeholder="반올림 HALF_UP" value={rounding} onChange={(e) => setRounding(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="환불 공제 기준" placeholder="환불 공제 DEDUCT_LINKED_REFUNDS 또는 NONE" value={refundBasis} onChange={(e) => setRefundBasis(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="결제 수수료 기준" placeholder="결제 수수료 FIXED_USD 또는 NONE" value={feeBasis} onChange={(e) => setFeeBasis(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="추가 공제 기준" placeholder="추가 공제 FIXED_USD 또는 NONE" value={extraBasis} onChange={(e) => setExtraBasis(e.target.value)} />
        <p className="text-xs text-gray-500">정산 주기는 월 단위입니다. 비어 있는 조건으로는 지급액을 만들지 않습니다.</p>
        <button type="button" className="w-fit rounded bg-black px-4 py-2 text-white" onClick={() => create.mutate()}>
          계약 등록
        </button>
      </div>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">번호</th>
            <th>상대</th>
            <th>상태</th>
            <th>버전</th>
            <th>요율 bps</th>
            <th>기준</th>
            <th>반올림</th>
            <th>주기</th>
            <th>지급 통화</th>
          </tr>
        </thead>
        <tbody>
          {(contracts.data ?? []).map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">{row.contractNumber}</td>
              <td>{row.counterpartyName}</td>
              <td>{row.status}</td>
              <td>{formatCount(row.versionNo)}</td>
              <td>{row.revenueShareBps == null ? '미정' : formatCount(row.revenueShareBps)}</td>
              <td>{row.settlementBasis ?? '미정'}</td>
              <td>{row.roundingPolicy ?? '미정'}</td>
              <td>{row.cycle ?? 'MONTHLY'}</td>
              <td>{row.payoutCurrency ?? '미정'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
