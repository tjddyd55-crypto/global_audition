'use client'

import type { AgencyBoardStatus } from '@/shared/api/auditions'
import { BTN_PRIMARY, BTN_SECONDARY } from '@/shared/ui/specClasses'
import {
  applicantCurrentStatusEmphasisClass,
  applicantStatusLabel,
} from './applicantDetailLabels'

type ApplicantDetailActionBarProps = {
  currentStatus: AgencyBoardStatus
  patching: boolean
  onRequestStatusChange: (status: AgencyBoardStatus) => void
}

const STATUS_ACTION_BUTTONS: { target: AgencyBoardStatus; label: string; primaryClass: string }[] = [
  {
    target: 'REVIEWING',
    label: '검토중으로 변경',
    primaryClass: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    target: 'APPROVED',
    label: '합격 처리',
    primaryClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    target: 'REJECTED',
    label: '불합격 처리',
    primaryClass: 'bg-red-600 hover:bg-red-700',
  },
]

export default function ApplicantDetailActionBar({
  currentStatus,
  patching,
  onRequestStatusChange,
}: ApplicantDetailActionBarProps) {
  return (
    <div className="shrink-0 space-y-3 border-t border-gray-200 bg-gray-50/80 px-4 py-4">
      <p className="text-sm text-gray-800">
        현재 상태:{' '}
        <span className={`font-semibold ${applicantCurrentStatusEmphasisClass(currentStatus)}`}>
          {applicantStatusLabel(currentStatus)}
        </span>
      </p>
      <div className="flex flex-col gap-2">
        {STATUS_ACTION_BUTTONS.map(({ target, label, primaryClass }) => {
          const isCurrent = currentStatus === target
          return (
            <button
              key={target}
              type="button"
              disabled={patching}
              className={
                isCurrent
                  ? `${BTN_PRIMARY} w-full justify-center ${primaryClass}`
                  : `${BTN_SECONDARY} w-full justify-center`
              }
              onClick={() => onRequestStatusChange(target)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
