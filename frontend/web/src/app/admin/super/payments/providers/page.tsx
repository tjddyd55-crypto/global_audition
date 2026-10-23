'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi, type PaymentCredentialView, type PaymentProviderAdmin } from '@/shared/api/superAdmin'

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
      <SecretForm providers={providers.data ?? []} />
    </div>
  )
}

function SecretForm({ providers }: { providers: PaymentProviderAdmin[] }) {
  const [providerId, setProviderId] = useState('TOSS_DOMESTIC')
  const [environment, setEnvironment] = useState<'TEST' | 'LIVE'>('TEST')
  const [clientKey, setClientKey] = useState('')
  const [clientId, setClientId] = useState('')
  const [secret, setSecret] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [saved, setSaved] = useState<PaymentCredentialView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => superAdminApi.rotatePaymentSecret(providerId, {
      environment,
      clientKey,
      clientId,
      secret,
      merchantId,
      webhookSecret,
    }),
    onSuccess: (view) => {
      setSecret('')
      setWebhookSecret('')
      setSaved(view)
      setError(null)
    },
    onError: () => setError('키를 저장하지 못했습니다.'),
  })
  const load = useMutation({
    mutationFn: () => superAdminApi.viewPaymentCredential(providerId, environment),
    onSuccess: (view) => {
      setSaved(view)
      setError(null)
    },
    onError: () => setError('마스킹 정보를 불러오지 못했습니다.'),
  })

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">키 등록</h2>
      <p className="text-sm text-gray-600">TEST와 LIVE는 분리 저장됩니다. 저장 후 시크릿은 끝 4자리만 보이며 다시 표시하지 않습니다. LIVE 키를 저장해도 LIVE 결제와 LIVE 환불은 실행되지 않습니다.</p>
      <form className="flex max-w-xl flex-col gap-2 text-sm" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
        <label className="flex flex-col gap-1">공급자
          <select className="rounded border px-2 py-1" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
            {providers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">키 환경
          <select className="rounded border px-2 py-1" value={environment} onChange={(event) => setEnvironment(event.target.value as 'TEST' | 'LIVE')}>
            <option value="TEST">TEST</option>
            <option value="LIVE">LIVE</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">Client Key
          <input className="rounded border px-2 py-1" value={clientKey} onChange={(event) => setClientKey(event.target.value)} autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1">Client ID
          <input className="rounded border px-2 py-1" value={clientId} onChange={(event) => setClientId(event.target.value)} autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1">Secret
          <input className="rounded border px-2 py-1" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="new-password" />
        </label>
        <label className="flex flex-col gap-1">Merchant ID
          <input className="rounded border px-2 py-1" value={merchantId} onChange={(event) => setMerchantId(event.target.value)} autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1">Webhook Secret
          <input className="rounded border px-2 py-1" type="password" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} autoComplete="new-password" />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="underline" disabled={save.isPending}>저장</button>
          <button type="button" className="underline" onClick={() => load.mutate()}>마스킹 조회</button>
        </div>
      </form>
      {environment === 'LIVE' && <p className="text-sm text-amber-800">LIVE 슬롯입니다. 결제 실행과 환불 실행은 꺼져 있습니다.</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && (
        <p className="text-sm">
          {saved.environment} · 설정 {saved.configured ? '있음' : '없음'} · secret {saved.secretLast4 || '없음'} · webhook {saved.webhookLast4 || '없음'}
          {saved.clientKey ? ` · client ${saved.clientKey}` : ''}
        </p>
      )}
    </section>
  )
}

export type { PaymentProviderAdmin }
