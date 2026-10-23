'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi } from '@/shared/api/superAdmin'
import { adminError } from '../desk'

export default function PaymentErrorsPage() {
  const qc = useQueryClient()
  const errors = useQuery({
    queryKey: ['superAdmin', 'payment-errors'],
    queryFn: () => superAdminApi.listPaymentErrors(),
  })
  const [scenario, setScenario] = useState('SUCCESS')
  const [message, setMessage] = useState<string | null>(null)
  const reprocess = useMutation({
    mutationFn: (errorId: string) => superAdminApi.reprocessPaymentError(errorId, scenario),
    onSuccess: async () => {
      setMessage('재처리 결과를 반영했습니다.')
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'payment-errors'] })
    },
    onError: (error) => setMessage(adminError(error)),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">결제 오류 관리</h1>
      <p className="text-sm text-gray-600">재시도 가능한 MOCK 오류만 시나리오를 지정해 다시 처리합니다. LIVE는 차단되고, TEST 결제를 성공으로 만들지 않습니다.</p>
      <label className="flex items-center gap-2 text-sm">재처리 시나리오
        <select className="rounded border px-2 py-1" value={scenario} onChange={(event) => setScenario(event.target.value)}>
          <option value="SUCCESS">성공</option>
          <option value="FAIL">실패</option>
          <option value="CANCEL">취소</option>
        </select>
      </label>
      {message && <p className="text-sm">{message}</p>}
      {errors.isLoading && <p>불러오는 중…</p>}
      {errors.error && <p className="text-sm text-red-700">{adminError(errors.error)}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              {['발생 시점', '관련 주문', '결제사', '실패 사유', '재시도', '처리 상태', '동작'].map((label) => (
                <th key={label} className="py-2 pr-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(errors.data ?? []).map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2 pr-3">{row.createdAt}</td>
                <td className="py-2 pr-3">{row.orderNo || '—'}</td>
                <td className="py-2 pr-3">{row.providerId || '—'}</td>
                <td className="py-2 pr-3">{row.code}{row.message && row.message !== row.code ? ` · ${row.message}` : ''}</td>
                <td className="py-2 pr-3">{row.retryable ? '가능' : '불가'}</td>
                <td className="py-2 pr-3">{row.processStatus}</td>
                <td className="py-2 pr-3">
                  <button
                    type="button"
                    className="underline disabled:text-gray-400"
                    disabled={!row.retryable || row.processStatus === 'REPROCESSED' || row.processStatus === 'BLOCKED' || reprocess.isPending}
                    onClick={() => { setMessage(null); reprocess.mutate(row.id) }}
                  >
                    재처리
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
