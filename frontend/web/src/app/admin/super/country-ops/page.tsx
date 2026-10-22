'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'

export default function CountryOpsPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const rows = useQuery({ queryKey: ['org', 'overview', period], queryFn: () => orgAdminApi.overview(period) })
  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">국가 실적과 정산</h1>
      <p className="mb-4 text-sm text-gray-600">
        국가 실적과 국가 관리자 계약 정산은 따로 봅니다. 숫자는 국가 관리자 화면과 같은 집계입니다. 예상 보상과 확정 보상은 다른 칸입니다.
      </p>
      <input className="mb-4 rounded border px-3 py-2" aria-label="조회 기간" value={period} onChange={(e) => setPeriod(e.target.value)} />
      {rows.isLoading ? <p className="text-sm text-gray-500">불러오는 중…</p> : null}
      {rows.error ? <p className="text-sm text-red-700">{orgErrorMessage(rows.error)}</p> : null}
      {!rows.isLoading && (rows.data ?? []).length === 0 ? <p className="text-sm text-gray-500">등록된 국가가 없습니다.</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">국가</th>
              <th>담당</th>
              <th>기획사</th>
              <th>승인 대기</th>
              <th>오디션</th>
              <th>지원</th>
              <th>수수료</th>
              <th>환불</th>
              <th>무료</th>
              <th>유료</th>
              <th>베이스</th>
              <th>예상</th>
              <th>지난 달 확정</th>
            </tr>
          </thead>
          <tbody>
            {(rows.data ?? []).map((row) => (
              <tr key={row.countryCode} className="border-b">
                <td className="py-2">{row.countryName} {row.countryCode}</td>
                <td>{row.representativeName ?? '—'}</td>
                <td>{row.agenciesApproved}/{row.agenciesRegistered}</td>
                <td>{row.pendingApprovals}</td>
                <td>{row.liveAuditions}</td>
                <td>{row.monthlyApplications}</td>
                <td>{row.feePerformanceUsd}</td>
                <td>{row.refundsUsd ?? '—'}</td>
                <td>{row.freeUsageCredits}</td>
                <td>{row.paidUsageCredits}</td>
                <td>{row.settlementBaseUsd ?? '—'}</td>
                <td>{row.expectedCompensation ?? '—'}</td>
                <td>{row.lastMonthConfirmedCompensation ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
