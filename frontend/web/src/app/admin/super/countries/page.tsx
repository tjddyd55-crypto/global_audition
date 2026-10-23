'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminKo } from '@/app/admin/org/copy'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'

export default function CountriesPage() {
  const qc = useQueryClient()
  const countries = useQuery({ queryKey: ['org', 'countries'], queryFn: () => orgAdminApi.countries() })
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('')
  const [userId, setUserId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => orgAdminApi.createCountry({ code, name, defaultCurrency: currency }),
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['org', 'countries'] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const appoint = useMutation({
    mutationFn: () => orgAdminApi.appoint(code, userId, 'APPOINTED'),
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['org', 'countries'] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const staff = useMutation({
    mutationFn: () => orgAdminApi.addStaff(code, staffId, ['CRM_READ', 'CRM_WRITE', 'CONSULT_LOG', 'AGENCY_REVIEW']),
    onSuccess: () => setError(null),
    onError: (err) => setError(orgErrorMessage(err)),
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{adminKo.countries}</h1>
      <p className="mb-4 text-sm text-gray-600">
        {adminKo.currencyRequired} 국가 관리자는 나라마다 활성 1명입니다. 교체해도 기존 계약과 매출 귀속은 바뀌지 않습니다.
      </p>
      <div className="mb-6 grid max-w-xl gap-2">
        <input className="rounded border px-3 py-2" placeholder="ISO 코드" aria-label="국가 코드" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="국가 이름" aria-label="국가 이름" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="기본 통화 (필수)" aria-label="기본 통화" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <button type="button" className="w-fit rounded bg-black px-4 py-2 text-white" onClick={() => { setError(null); create.mutate() }}>
          국가 등록
        </button>
        <input className="rounded border px-3 py-2" placeholder="국가 관리자 사용자 ID" aria-label="국가 관리자" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <button type="button" className="w-fit rounded bg-black px-4 py-2 text-white" onClick={() => appoint.mutate()}>
          대표 임명
        </button>
        <input className="rounded border px-3 py-2" placeholder="직원 사용자 ID" aria-label="국가 직원" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
        <button type="button" className="w-fit rounded border px-4 py-2" onClick={() => staff.mutate()}>
          직원 추가
        </button>
      </div>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {countries.isLoading ? <p>불러오는 중…</p> : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">코드</th>
            <th>이름</th>
            <th>상태</th>
            <th>통화</th>
            <th>활성 대표</th>
          </tr>
        </thead>
        <tbody>
          {(countries.data ?? []).map((row) => (
            <tr key={row.code} className="border-b">
              <td className="py-2">{row.code}</td>
              <td>{row.name}</td>
              <td>{row.status}</td>
              <td>{row.currency}</td>
              <td>{row.representativeUserId ?? '없음'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
