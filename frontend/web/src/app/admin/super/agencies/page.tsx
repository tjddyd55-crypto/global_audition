'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminKo } from '@/app/admin/org/copy'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'
import { AGENCY_APPROVAL_SUCCESS_NOTICE } from './approvalNotice'

export default function AgenciesPage() {
  const qc = useQueryClient()
  const [country, setCountry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const agencies = useQuery({
    queryKey: ['org', 'agencies', country],
    queryFn: () => orgAdminApi.agencies(country),
    enabled: country.trim().length === 2,
  })
  const decide = useMutation({
    mutationFn: (input: { id: string; action: string }) => {
      setNotice(null)
      setError(null)
      return orgAdminApi.decide(input.id, input.action, '본사 화면')
    },
    onSuccess: async () => {
      setError(null)
      setNotice(AGENCY_APPROVAL_SUCCESS_NOTICE)
      await qc.invalidateQueries({ queryKey: ['org', 'agencies', country] })
    },
    onError: (err) => {
      setNotice(null)
      setError(orgErrorMessage(err))
    },
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{adminKo.agencies}</h1>
      <p className="mb-4 text-sm text-gray-600">
        {adminKo.approval}. 국가 검토 뒤에만 본사가 승인할 수 있습니다. 국가 관리자의 승인 요청은 서버가 거절합니다.
      </p>
      <input
        className="mb-4 rounded border px-3 py-2"
        placeholder="국가 코드"
        aria-label="기획사 국가"
        value={country}
        onChange={(e) => setCountry(e.target.value.toUpperCase())}
      />
      {notice ? <p className="mb-4 text-sm text-green-700" role="status">{notice}</p> : null}
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">이름</th>
            <th>단계</th>
            <th>승인</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(agencies.data ?? []).map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">{row.displayName}</td>
              <td>{row.stage}</td>
              <td>{row.approvalState}</td>
              <td className="space-x-2">
                <button type="button" className="underline" onClick={() => decide.mutate({ id: row.id, action: 'HQ_APPROVE' })}>
                  본사 승인
                </button>
                <button type="button" className="underline" onClick={() => decide.mutate({ id: row.id, action: 'HQ_REJECT' })}>
                  거절
                </button>
                <button type="button" className="underline" onClick={() => decide.mutate({ id: row.id, action: 'SUSPEND' })}>
                  정지
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
