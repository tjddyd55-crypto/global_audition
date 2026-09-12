'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { superAdminApi, type PaymentSettingsAdmin } from '@/shared/api/superAdmin'

function errMsg(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string; code?: string } | undefined
    if (d?.code === 'INSUFFICIENT_CREDITS') return 'INSUFFICIENT_CREDITS'
    return d?.message ?? err.message ?? '요청 실패'
  }
  return '요청 실패'
}

function resultTone(result: string | null): string {
  if (!result) return 'text-gray-700'
  if (result.includes('CONNECTED')) return 'text-emerald-700'
  if (result === 'CONFIG INCOMPLETE') return 'text-amber-700'
  return 'text-red-700'
}

export default function PaymentSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['superAdmin', 'payment-settings'],
    queryFn: () => superAdminApi.getPaymentSettings(),
  })

  const [enabled, setEnabled] = useState(false)
  const [environment, setEnvironment] = useState<'TEST' | 'LIVE'>('TEST')
  const [testClientKey, setTestClientKey] = useState('')
  const [liveClientKey, setLiveClientKey] = useState('')
  const [testSecretKey, setTestSecretKey] = useState('')
  const [liveSecretKey, setLiveSecretKey] = useState('')
  const [variantKey, setVariantKey] = useState('')
  const [mid, setMid] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    applyView(data)
  }, [data])

  const saveMut = useMutation({
    mutationFn: () =>
      superAdminApi.patchPaymentSettings({
        enabled,
        environment,
        currency: 'USD',
        testClientKey,
        liveClientKey,
        testSecretKey: testSecretKey.trim() || undefined,
        liveSecretKey: liveSecretKey.trim() || undefined,
        foreignCardKrw: false,
        foreignCurrencyEnabled: true,
        variantKey,
        mid,
      }),
    onSuccess: (view) => {
      setSaveError(null)
      setTestSecretKey('')
      setLiveSecretKey('')
      applyView(view)
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'payment-settings'] })
    },
    onError: (err) => setSaveError(errMsg(err)),
  })

  const testMut = useMutation({
    mutationFn: () => superAdminApi.testPaymentConnection(),
    onSuccess: (res) => setTestResult(res.result),
    onError: (err) => setTestResult(errMsg(err)),
  })

  function applyView(view: PaymentSettingsAdmin) {
    setEnabled(view.enabled)
    setEnvironment(view.environment === 'LIVE' ? 'LIVE' : 'TEST')
    setTestClientKey(view.testClientKey ?? '')
    setLiveClientKey(view.liveClientKey ?? '')
    setVariantKey(view.variantKey ?? '')
    setMid(view.mid ?? '')
  }

  const activationReady = Boolean(data?.activationReady)
  const method = data?.tossMethod ?? 'FOREIGN_EASY_PAY'
  const providerEasyPay = data?.foreignEasyPayProvider ?? 'PAYPAL'

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">토스 결제 설정</h1>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 text-xs text-gray-500">
          TEST 키를 붙여 넣고 저장한 뒤 연결 테스트를 실행하세요. 시크릿은 GET 시 마스킹됩니다. LIVE 과금은 리뷰 전까지
          켜지 마세요. CARD+USD 는 사용하지 않습니다.
        </p>
        {isLoading && <p className="text-sm text-gray-600">불러오는 중…</p>}
        {error && <p className="text-sm text-red-700">설정을 불러오지 못했습니다.</p>}
        {saveError && <p className="mb-2 text-sm text-red-700">{saveError}</p>}

        {data && (
          <div className="grid max-w-2xl gap-3 text-sm">
            <div className="grid gap-1 rounded border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700">
              <p>
                <span className="font-semibold">Provider</span> Toss
              </p>
              <p>
                <span className="font-semibold">Method</span> {method}
              </p>
              <p>
                <span className="font-semibold">Easy pay</span> {providerEasyPay}
              </p>
              <p>
                <span className="font-semibold">Currency</span> USD (integer major unit only)
              </p>
              <p>
                <span className="font-semibold">Activation</span>{' '}
                {activationReady ? 'READY (variantKey + MID + env keys)' : 'OFF — variantKey/MID/keys incomplete'}
              </p>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              토스 결제 사용 (활성화는 variantKey + MID + 해당 환경 client/secret 이 있을 때만)
            </label>
            <label className="flex flex-col gap-1">
              환경
              <select
                className="rounded border border-gray-300 px-2 py-1.5"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value === 'LIVE' ? 'LIVE' : 'TEST')}
              >
                <option value="TEST">TEST</option>
                <option value="LIVE">LIVE</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              TEST client key
              <input
                className="rounded border px-2 py-1.5 font-mono"
                value={testClientKey}
                onChange={(e) => setTestClientKey(e.target.value)}
                placeholder="test_ck_…"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1">
              LIVE client key
              <input
                className="rounded border px-2 py-1.5 font-mono"
                value={liveClientKey}
                onChange={(e) => setLiveClientKey(e.target.value)}
                placeholder="live_ck_…"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1">
              TEST secret (저장된 값: {data.testSecretMasked ?? '없음'})
              <input
                type="password"
                className="rounded border px-2 py-1.5 font-mono"
                value={testSecretKey}
                onChange={(e) => setTestSecretKey(e.target.value)}
                placeholder="변경할 때만 붙여넣기"
                autoComplete="new-password"
              />
            </label>
            <label className="flex flex-col gap-1">
              LIVE secret (저장된 값: {data.liveSecretMasked ?? '없음'})
              <input
                type="password"
                className="rounded border px-2 py-1.5 font-mono"
                value={liveSecretKey}
                onChange={(e) => setLiveSecretKey(e.target.value)}
                placeholder="변경할 때만 붙여넣기"
                autoComplete="new-password"
              />
            </label>
            <label className="flex flex-col gap-1">
              variantKey (활성화 필수)
              <input
                className="rounded border px-2 py-1.5"
                value={variantKey}
                onChange={(e) => setVariantKey(e.target.value)}
                placeholder="variantKey"
              />
            </label>
            <label className="flex flex-col gap-1">
              MID (활성화 필수)
              <input className="rounded border px-2 py-1.5" value={mid} onChange={(e) => setMid(e.target.value)} placeholder="MID" />
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={saveMut.isPending}
                onClick={() => saveMut.mutate()}
                className="rounded bg-[#3B82F6] px-3 py-2 text-white disabled:bg-gray-300"
              >
                저장
              </button>
              <button
                type="button"
                disabled={testMut.isPending}
                onClick={() => testMut.mutate()}
                className="rounded border border-gray-300 px-3 py-2"
              >
                연결 테스트 (실과금 없음)
              </button>
            </div>
            {testResult ? (
              <p className={`font-mono text-sm font-semibold ${resultTone(testResult)}`}>{testResult}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
