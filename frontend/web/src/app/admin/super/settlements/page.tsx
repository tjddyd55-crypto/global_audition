'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminKo } from '@/app/admin/org/copy'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'

export default function SettlementsPage() {
  const qc = useQueryClient()
  const [country, setCountry] = useState('')
  const [contractId, setContractId] = useState('')
  const [period, setPeriod] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const rows = useQuery({
    queryKey: ['org', 'settlements', country],
    queryFn: () => orgAdminApi.settlements(country),
    enabled: country.trim().length === 2,
  })
  const refresh = async () => {
    setError(null)
    await qc.invalidateQueries({ queryKey: ['org', 'settlements', country] })
  }
  const calculate = useMutation({
    mutationFn: () => orgAdminApi.calculate(country, contractId, period),
    onSuccess: refresh,
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const approve = useMutation({
    mutationFn: (id: string) => orgAdminApi.approveSettlement(id),
    onSuccess: refresh,
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const payout = useMutation({
    mutationFn: (id: string) => orgAdminApi.recordPayout(id, note),
    onSuccess: refresh,
    onError: (err) => setError(orgErrorMessage(err)),
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{adminKo.settlement}</h1>
      <p className="mb-4 text-sm text-gray-600">{adminKo.payoutManual}</p>
      <div className="mb-6 grid max-w-xl gap-2">
        <input className="rounded border px-3 py-2" aria-label="정산 국가" placeholder="국가 코드" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} />
        <input className="rounded border px-3 py-2" aria-label="계약 ID" placeholder="계약 ID" value={contractId} onChange={(e) => setContractId(e.target.value)} />
        <input className="rounded border px-3 py-2" aria-label="정산 기간" placeholder="YYYY-MM" value={period} onChange={(e) => setPeriod(e.target.value)} />
        <button type="button" className="w-fit rounded bg-black px-4 py-2 text-white" onClick={() => calculate.mutate()}>
          정산 계산
        </button>
        <input className="rounded border px-3 py-2" aria-label="지급 메모" placeholder="지급 메모 (이체 없음)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">기간</th>
            <th>상태</th>
            <th>베이스</th>
            <th>보상</th>
            <th>본사</th>
            <th>비고</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(rows.data ?? []).map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">{row.period}</td>
              <td>{row.status}</td>
              <td>{row.settlementBaseFinal ?? row.settlementBaseUsd ?? '—'}</td>
              <td>{row.compensationFinal ?? row.compensationUsd ?? '미계산'}</td>
              <td>{row.hqShareFinal ?? row.hqShareUsd ?? '—'}</td>
              <td>{row.note}</td>
              <td className="space-x-2">
                <button type="button" className="underline" onClick={() => approve.mutate(row.id)}>
                  승인
                </button>
                <button type="button" className="underline" onClick={() => payout.mutate(row.id)}>
                  지급 기록
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
