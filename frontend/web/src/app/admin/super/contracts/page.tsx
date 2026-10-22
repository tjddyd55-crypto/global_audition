'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminKo } from '@/app/admin/org/copy'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'

export default function ContractsPage() {
  const qc = useQueryClient()
  const [country, setCountry] = useState('')
  const [number, setNumber] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [currency, setCurrency] = useState('')
  const [start, setStart] = useState('')
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
        revenueShareBps: null,
        settlementBasis: null,
        paymentFeeUsd: null,
        extraDeductionUsd: null,
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
          </tr>
        </thead>
        <tbody>
          {(contracts.data ?? []).map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">{row.contractNumber}</td>
              <td>{row.counterpartyName}</td>
              <td>{row.status}</td>
              <td>{row.versionNo}</td>
              <td>{row.revenueShareBps ?? '미정'}</td>
              <td>{row.settlementBasis ?? '미정'}</td>
              <td>{row.roundingPolicy ?? 'UNDECIDED'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
