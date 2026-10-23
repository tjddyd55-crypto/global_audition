'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { adminKo } from '@/app/admin/org/copy'
import { orgAdminApi } from '@/shared/api/orgAdmin'
import { formatCount, formatUsdAmount } from '@/shared/money/currency'

export default function RevenuePage() {
  const [country, setCountry] = useState('')
  const policy = useQuery({ queryKey: ['org', 'policy'], queryFn: () => orgAdminApi.policy() })
  const stats = useQuery({
    queryKey: ['org', 'stats', country],
    queryFn: () => orgAdminApi.globalStats(country.trim().length === 2 ? country : undefined),
  })

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{adminKo.revenue}</h1>
      <p className="mb-2 text-sm text-gray-600">{adminKo.sales}. {adminKo.undecided}</p>
      <p className="mb-4 text-sm text-gray-600">
        패리티 {policy.data?.creditParity ?? '1 USD = 1 Credit'}. 현금 환산 {policy.data?.cashToUsageMapping ?? 'UNDECIDED'}. 반올림{' '}
        {policy.data?.roundingPolicy ?? 'UNDECIDED'}.
      </p>
      <input
        className="mb-4 rounded border px-3 py-2"
        aria-label="통계 국가"
        placeholder="국가 코드 (비우면 전체)"
        value={country}
        onChange={(e) => setCountry(e.target.value.toUpperCase())}
      />
      {stats.isLoading ? <p>불러오는 중…</p> : null}
      {stats.data ? (
        <p className="mb-4 text-sm text-gray-700">
          국가 {formatCount(stats.data.countries)} · 활성 국가관리자 {formatCount(stats.data.activeCountryAdmins)} · 기획사 {formatCount(stats.data.agenciesRegistered)} / 승인{' '}
          {formatCount(stats.data.agenciesApproved)} · 지점 미연결 오디션 {formatCount(stats.data.auditionsUnlinked)}
        </p>
      ) : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">국가</th>
            <th>오디션</th>
            <th>지원</th>
            <th>회계 현금</th>
            <th>환불</th>
            <th>영업 스냅샷</th>
            <th>영업 현금</th>
            <th>정산 베이스</th>
            <th>보상</th>
            <th>본사</th>
            <th>정산/미정산</th>
          </tr>
        </thead>
        <tbody>
          {(stats.data?.slices ?? []).map((row) => (
            <tr key={row.country} className="border-b">
              <td className="py-2">{row.country}</td>
              <td>{formatCount(row.auditions)}</td>
              <td>{formatCount(row.applications)}</td>
              <td>{formatUsdAmount(row.accountingRevenueUsd)}</td>
              <td>{formatUsdAmount(row.refundsUsd)}</td>
              <td>{formatUsdAmount(row.salesFeeSnapshotUsd)}</td>
              <td>{row.salesCashUsd === null ? '미정' : formatUsdAmount(row.salesCashUsd)}</td>
              <td>{formatUsdAmount(row.settlementBaseUsd)}</td>
              <td>{formatUsdAmount(row.compensationUsd)}</td>
              <td>{formatUsdAmount(row.hqShareUsd)}</td>
              <td>
                {formatCount(row.settledCount)}/{formatCount(row.unsettledCount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
