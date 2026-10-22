'use client'

import { Suspense } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { adminKo } from '@/app/admin/org/copy'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'
import { userApi } from '@/shared/api/user'

export default function CountryHomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">불러오는 중…</p>}>
      <CountryHome />
    </Suspense>
  )
}

function CountryHome() {
  const params = useSearchParams()
  const tab = params.get('tab') ?? 'status'
  const qc = useQueryClient()
  const me = useQuery({ queryKey: ['currentUser'], queryFn: () => userApi.getCurrentUser() })
  const countries = useQuery({ queryKey: ['org', 'countries'], queryFn: () => orgAdminApi.countries() })
  const country = countries.data?.[0]?.code ?? ''
  const agencies = useQuery({
    queryKey: ['org', 'agencies', country],
    queryFn: () => orgAdminApi.agencies(country),
    enabled: country.length === 2,
  })
  const stats = useQuery({
    queryKey: ['org', 'country-stats', country],
    queryFn: () => orgAdminApi.countryStats(country),
    enabled: country.length === 2,
  })
  const settlements = useQuery({
    queryKey: ['org', 'settlements', country],
    queryFn: () => orgAdminApi.settlements(country),
    enabled: country.length === 2 && me.data?.role === 'COUNTRY_ADMIN',
  })
  const [staffId, setStaffId] = useState('')
  const [note, setNote] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const staff = useMutation({
    mutationFn: () => orgAdminApi.addStaff(country, staffId, ['CRM_READ', 'CONSULT_LOG']),
    onSuccess: () => setError(null),
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const consult = useMutation({
    mutationFn: () => orgAdminApi.consult(agencyId, note),
    onSuccess: () => setError(null),
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const recommend = useMutation({
    mutationFn: () => orgAdminApi.decide(agencyId, 'RECOMMEND', '국가 추천'),
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['org', 'agencies', country] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">국가 운영</h1>
      <p className="mb-4 text-sm text-gray-600">
        {adminKo.countryOnly} 역할 {me.data?.role ?? '-'}. 계약 요율은 수정할 수 없습니다.
      </p>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <p className="mb-4 text-sm">국가 {country || '배정 없음'} · 화면 {tab}</p>
      {(tab === 'status' || tab === 'crm') && (
        <section className="mb-6 rounded border bg-white p-4">
          <h2 className="mb-2 font-semibold">직원과 기획사</h2>
          {me.data?.role === 'COUNTRY_ADMIN' ? (
            <div className="mb-3 flex gap-2">
              <input className="rounded border px-3 py-2" aria-label="직원 ID" value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="직원 사용자 ID" />
              <button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={() => staff.mutate()}>
                직원 추가
              </button>
            </div>
          ) : (
            <p className="mb-3 text-sm text-gray-600">직원은 배정된 기획사와 상담 로그만 다룹니다.</p>
          )}
          <ul className="text-sm">
            {(agencies.data ?? []).map((row) => (
              <li key={row.id}>
                {row.displayName} · {row.stage} · {row.approvalState}
              </li>
            ))}
          </ul>
          <div className="mt-3 grid max-w-xl gap-2">
            <input className="rounded border px-3 py-2" aria-label="상담 기획사" placeholder="기획사 ID" value={agencyId} onChange={(e) => setAgencyId(e.target.value)} />
            <input className="rounded border px-3 py-2" aria-label="상담 내용" placeholder="상담 내용" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" className="w-fit rounded border px-3 py-2" onClick={() => consult.mutate()}>
              상담 기록
            </button>
          </div>
        </section>
      )}
      {tab === 'review' && me.data?.role === 'COUNTRY_ADMIN' ? (
        <section className="mb-6 rounded border bg-white p-4">
          <h2 className="mb-2 font-semibold">기획사 검토</h2>
          <button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={() => recommend.mutate()}>
            본사 승인 요청
          </button>
        </section>
      ) : null}
      {tab === 'performance' ? (
        <section className="mb-6 rounded border bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold">실적</h2>
          <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(stats.data ?? {}, null, 2)}</pre>
        </section>
      ) : null}
      {tab === 'settlement' && me.data?.role === 'COUNTRY_ADMIN' ? (
        <section className="rounded border bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold">예상 정산</h2>
          <p className="mb-2 text-gray-600">{adminKo.payoutManual}</p>
          <ul>
            {(settlements.data ?? []).map((row) => (
              <li key={row.id}>
                {row.period} {row.status} 베이스 {row.settlementBaseUsd ?? '미정'} 보상 {row.compensationUsd ?? '미계산'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
