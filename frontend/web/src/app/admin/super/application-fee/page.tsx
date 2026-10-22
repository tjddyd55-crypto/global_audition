'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { superAdminApi } from '@/shared/api/superAdmin'

function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message
  }
  return '요청 실패'
}

export default function ApplicationFeePage() {
  const qc = useQueryClient()
  const fee = useQuery({
    queryKey: ['superAdmin', 'application-fee'],
    queryFn: () => superAdminApi.getApplicationFee(),
  })
  const history = useQuery({
    queryKey: ['superAdmin', 'application-fee-history'],
    queryFn: () => superAdminApi.listApplicationFeeHistory(),
  })
  const [amount, setAmount] = useState('0')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (fee.data) setAmount(String(fee.data.amountUsd))
  }, [fee.data])

  const save = useMutation({
    mutationFn: () => {
      if (!/^\d+$/.test(amount.trim())) {
        throw new Error('정수 USD만 입력할 수 있습니다.')
      }
      return superAdminApi.patchApplicationFee(Number(amount.trim()))
    },
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'application-fee'] })
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'application-fee-history'] })
    },
    onError: (err) => setError(errorMessage(err)),
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">전역 지원비</h1>
      <p className="mb-4 text-sm text-gray-600">
        모든 오디션에 같은 정수 USD를 적용합니다. 지원 화면은 이 서버 값을 읽고, 지원 처리 때도 서버가 이 금액으로
        검증합니다. 0이면 무료입니다.
      </p>
      {fee.isLoading ? <p>불러오는 중…</p> : null}
      <div className="mb-6 flex items-center gap-2">
        <input
          inputMode="numeric"
          className="w-32 rounded border px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="전역 지원비 USD"
        />
        <span>USD</span>
        <button
          type="button"
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          저장
        </button>
      </div>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <h2 className="mb-2 text-lg font-semibold">변경 이력</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">이전</th>
            <th>이후</th>
            <th>변경자</th>
            <th>시각</th>
            <th>출처</th>
          </tr>
        </thead>
        <tbody>
          {(history.data ?? []).map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">{row.oldAmountUsd}</td>
              <td>{row.newAmountUsd}</td>
              <td>{row.changedBy ?? '-'}</td>
              <td>{row.changedAt}</td>
              <td>{row.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
