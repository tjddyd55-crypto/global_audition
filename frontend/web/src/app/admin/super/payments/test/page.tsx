'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { creditsApi } from '@/shared/api/credits'
import { orgAdminApi } from '@/shared/api/orgAdmin'
import { superAdminApi } from '@/shared/api/superAdmin'
import { formatMinorGrouped } from '@/shared/money/minor'
import { adminError, count } from '../desk'

export default function PaymentTestPage() {
  const packages = useQuery({
    queryKey: ['superAdmin', 'credit-packages'],
    queryFn: () => superAdminApi.listCreditPackages(),
  })
  const [email, setEmail] = useState('')
  const [packageId, setPackageId] = useState('')
  const [country, setCountry] = useState('JP')
  const [contractId, setContractId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [quoteText, setQuoteText] = useState<string | null>(null)
  const [resultText, setResultText] = useState<string | null>(null)
  const [shareText, setShareText] = useState<string | null>(null)
  const user = useQuery({
    queryKey: ['superAdmin', 'payment-test-user', email],
    queryFn: () => superAdminApi.lookupPaymentTestUser(email.trim()),
    enabled: false,
  })
  const contracts = useQuery({
    queryKey: ['org', 'contracts', country],
    queryFn: () => orgAdminApi.contracts(country.trim().toUpperCase()),
    enabled: country.trim().length === 2,
  })
  const quote = useMutation({
    mutationFn: () => creditsApi.quotePayment({
      packageId,
      paymentCountry: 'KR',
      providerId: 'MOCK',
      methodCode: 'MOCK_CARD',
    }),
    onSuccess: (row) => {
      setQuoteText(`${count(row.credits)} 크레딧 · ${formatMinorGrouped(row.chargeAmountMinor, row.chargeCurrency, 'ko')} · 가맹 ${row.merchantCountry} · ${row.environment}`)
    },
    onError: (error) => setQuoteText(adminError(error)),
  })
  const run = useMutation({
    mutationFn: (scenario: 'SUCCESS' | 'FAIL' | 'CANCEL') => superAdminApi.runPaymentMockTest({
      email: email.trim(),
      packageId,
      paymentCountry: 'KR',
      scenario,
    }),
    onSuccess: (row) => {
      const wallet = count(row.walletBalance ?? 0)
      const closing = row.ledgerClosing == null ? '—' : count(row.ledgerClosing)
      setResultText(`주문 ${row.orderNo || '—'} · ${row.status || row.error || '—'} · 지갑 ${wallet} · 원장 마감 ${closing} · 충전 ${count(row.chargeCount ?? 0)}회`)
    },
    onError: (error) => setResultText(adminError(error)),
  })
  const share = useMutation({
    mutationFn: () => superAdminApi.previewTestRevenue({
      country: country.trim().toUpperCase(),
      contractId,
      from: new Date(`${from}T00:00:00`).toISOString(),
      to: new Date(`${to}T00:00:00`).toISOString(),
    }),
    onSuccess: (row) => {
      setShareText(`라벨 ${String(row.label ?? '')} · 운영 지급 제외 ${String(row.excludedFromLivePayout ?? '')} · 대상 USD ${String(row.targetUsd ?? '')} · 비율 bps ${String(row.rateBps ?? '')} · 보상 ${String(row.compensation ?? '')}`)
    },
    onError: (error) => setShareText(adminError(error)),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">결제 테스트</h1>
      <p className="text-sm text-gray-600">이 화면은 MOCK 원장만 움직입니다. 운영 환경에서는 MOCK 서버가 차단됩니다. 토스·PayPal 성공으로 기록하지 않습니다.</p>
      <form className="flex flex-wrap items-end gap-2 text-sm" onSubmit={(event) => { event.preventDefault(); void user.refetch() }}>
        <label className="flex flex-col gap-1">테스트 계정 이메일
          <input className="rounded border px-2 py-1" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button type="submit" className="underline">계정 확인</button>
      </form>
      {user.data && <p className="text-sm">{user.data.email} · {user.data.role}</p>}
      {user.error && <p className="text-sm text-red-700">{adminError(user.error)}</p>}
      <label className="flex flex-col gap-1 text-sm">충전 크레딧
        <select className="w-fit rounded border px-2 py-1" value={packageId} onChange={(event) => setPackageId(event.target.value)}>
          <option value="">선택</option>
          {(packages.data ?? []).filter((row) => row.active).map((row) => (
            <option key={row.id} value={row.id}>{row.name} · {count(row.credits)} 크레딧</option>
          ))}
        </select>
      </label>
      <button type="button" className="w-fit underline" disabled={!packageId || quote.isPending} onClick={() => quote.mutate()}>KRW 견적</button>
      {quoteText && <p className="text-sm">{quoteText}</p>}
      <div className="flex gap-3 text-sm">
        <button type="button" className="underline" disabled={!email || !packageId || run.isPending} onClick={() => run.mutate('SUCCESS')}>성공</button>
        <button type="button" className="underline" disabled={!email || !packageId || run.isPending} onClick={() => run.mutate('FAIL')}>실패</button>
        <button type="button" className="underline" disabled={!email || !packageId || run.isPending} onClick={() => run.mutate('CANCEL')}>취소</button>
      </div>
      {resultText && <p className="text-sm">결과 · 원장 확인: {resultText}</p>}
      <h2 className="text-lg font-semibold">국가별 테스트 수익 배분</h2>
      <p className="text-sm text-gray-600">정산 원장에는 쓰지 않습니다. 테스트 금액은 운영 매출에 넣지 않습니다.</p>
      <form className="flex flex-wrap items-end gap-2 text-sm" onSubmit={(event) => { event.preventDefault(); share.mutate() }}>
        <label className="flex flex-col gap-1">국가
          <input className="w-20 rounded border px-2 py-1" value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} />
        </label>
        <label className="flex flex-col gap-1">계약
          <select className="rounded border px-2 py-1" value={contractId} onChange={(event) => setContractId(event.target.value)}>
            <option value="">선택</option>
            {(contracts.data ?? []).map((row) => (
              <option key={row.id} value={row.id}>{row.contractNumber} · {row.status}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">시작
          <input className="rounded border px-2 py-1" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1">종료
          <input className="rounded border px-2 py-1" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <button type="submit" className="underline" disabled={!contractId || !from || !to || share.isPending}>배분 확인</button>
      </form>
      {shareText && <p className="text-sm">{shareText}</p>}
    </div>
  )
}
