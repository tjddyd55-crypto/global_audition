'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi, type PaymentProviderAdmin } from '@/shared/api/superAdmin'

export default function PaymentProvidersPage() {
  const qc = useQueryClient()
  const providers = useQuery({
    queryKey: ['superAdmin', 'payment-providers'],
    queryFn: () => superAdminApi.listPaymentProviders(),
  })
  const methods = useQuery({
    queryKey: ['superAdmin', 'payment-methods'],
    queryFn: () => superAdminApi.listPaymentCountryMethods(),
  })
  const connect = useMutation({
    mutationFn: (id: string) => superAdminApi.testProviderConnection(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'payment-providers'] })
    },
  })
  const fx = useQuery({
    queryKey: ['superAdmin', 'payment-fx', 'KRW'],
    queryFn: () => superAdminApi.listFxRates('KRW'),
  })
  const [fxRate, setFxRate] = useState('')
  const addFx = useMutation({
    mutationFn: () => superAdminApi.addFxRate({
      chargeCurrency: 'KRW',
      rate: fxRate,
      basis: 'SA_RATE',
      roundingMode: 'HALF_UP',
      effectiveFrom: new Date().toISOString(),
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'payment-fx', 'KRW'] })
    },
  })

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold">결제 공급자</h1>
      <p className="text-sm text-gray-600">연결되지 않은 공급자는 결제 가능으로 표시하지 않습니다. LIVE 실행은 이 화면에서 켜지지 않습니다.</p>
      {providers.isLoading && <p>불러오는 중…</p>}
      {providers.error && <p className="text-red-700">공급자를 불러오지 못했습니다.</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-3">이름</th>
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">환경</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">연결</th>
              <th className="py-2 pr-3">구현</th>
              <th className="py-2 pr-3">사용 가능</th>
              <th className="py-2 pr-3">변경</th>
            </tr>
          </thead>
          <tbody>
            {(providers.data ?? []).map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2 pr-3">{row.name}</td>
                <td className="py-2 pr-3">{row.id}</td>
                <td className="py-2 pr-3">{row.environment}</td>
                <td className="py-2 pr-3">{row.contractStatus}</td>
                <td className="py-2 pr-3">{row.connectionStatus}</td>
                <td className="py-2 pr-3">{row.implemented ? 'YES' : 'NO'}</td>
                <td className="py-2 pr-3">{row.operable ? 'YES' : 'NO'}</td>
                <td className="py-2 pr-3">
                  <button type="button" className="underline" onClick={() => connect.mutate(row.id)}>
                    연결 확인
                  </button>
                  <div className="text-xs text-gray-500">{row.updatedAt}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-lg font-semibold">국가별 결제 수단</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {(methods.data ?? []).map((row) => (
          <li key={row.id}>
            {row.paymentCountry} / 가맹 {row.merchantCountry} / {row.providerId} / {row.methodCode} / {row.currency} / {row.enabled ? '후보 활성' : '후보 비활성'}
          </li>
        ))}
      </ul>
      {connect.data && <p className="text-sm">마지막 연결 확인: {connect.data.providerId} {connect.data.result}</p>}
      <h2 className="text-lg font-semibold">KRW 환산</h2>
      <p className="text-sm text-gray-600">1 USD = 1 Credit. 청구 금액은 여기서 정한 환율을 주문에 스냅샷합니다.</p>
      <form className="flex items-center gap-2 text-sm" onSubmit={(event) => { event.preventDefault(); addFx.mutate() }}>
        <label htmlFor="krw-rate">KRW per 1 USD</label>
        <input id="krw-rate" className="rounded border px-2 py-1" value={fxRate} onChange={(event) => setFxRate(event.target.value)} />
        <button type="submit" className="underline" disabled={!fxRate || addFx.isPending}>환율 저장</button>
      </form>
      <ul className="text-sm">
        {(fx.data ?? []).map((row) => (
          <li key={row.id}>{row.chargeCurrency} {row.rate} {row.basis} {row.roundingMode} {row.effectiveFrom}</li>
        ))}
      </ul>
    </div>
  )
}

export type { PaymentProviderAdmin }
