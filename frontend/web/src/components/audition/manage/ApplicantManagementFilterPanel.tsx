'use client'

import { CARD_BASE, TEXT_SUB } from '@/shared/ui/specClasses'
import type { AgencyBoardStatus } from '@/shared/api/auditions'

type SnsFilterValue = 'all' | 'yes' | 'no'

type ApplicantManagementFilterPanelProps = {
  minAge: string
  maxAge: string
  nationality: string
  status: string
  hasSns: SnsFilterValue
  onMinAgeChange: (value: string) => void
  onMaxAgeChange: (value: string) => void
  onNationalityChange: (value: string) => void
  onStatusChange: (value: AgencyBoardStatus | '') => void
  onHasSnsChange: (value: SnsFilterValue) => void
}

export default function ApplicantManagementFilterPanel({
  minAge,
  maxAge,
  nationality,
  status,
  hasSns,
  onMinAgeChange,
  onMaxAgeChange,
  onNationalityChange,
  onStatusChange,
  onHasSnsChange,
}: ApplicantManagementFilterPanelProps) {
  return (
    <div className={`${CARD_BASE} flex flex-col gap-4`}>
      <p className={`${TEXT_SUB} font-semibold text-gray-900`}>필터</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">나이 최소</span>
          <input
            type="number"
            min={0}
            value={minAge}
            onChange={(e) => onMinAgeChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-2"
            placeholder="예: 18"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">나이 최대</span>
          <input
            type="number"
            min={0}
            value={maxAge}
            onChange={(e) => onMaxAgeChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-2"
            placeholder="예: 35"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">국적</span>
          <select
            value={nationality}
            onChange={(e) => onNationalityChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2"
          >
            <option value="">전체</option>
            <option value="KR">대한민국</option>
            <option value="MN">몽골</option>
            <option value="JP">일본</option>
            <option value="OTHER">기타</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">심사 상태</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as AgencyBoardStatus | '')}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2"
          >
            <option value="">전체</option>
            <option value="PENDING">대기</option>
            <option value="REVIEWING">검토중</option>
            <option value="APPROVED">합격</option>
            <option value="REJECTED">탈락</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
          <span className="text-gray-600">SNS</span>
          <select
            value={hasSns}
            onChange={(e) => onHasSnsChange(e.target.value as SnsFilterValue)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2"
          >
            <option value="all">전체</option>
            <option value="yes">있음</option>
            <option value="no">없음</option>
          </select>
        </label>
      </div>
    </div>
  )
}
