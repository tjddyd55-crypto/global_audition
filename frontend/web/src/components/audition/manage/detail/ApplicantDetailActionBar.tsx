'use client'

import { useTranslations } from 'next-intl'
import type { AgencyBoardStatus } from '@/shared/api/auditions'
import { BTN_PRIMARY, BTN_SECONDARY } from '@/shared/ui/specClasses'
import {
  applicantCurrentStatusEmphasisClass,
  applicantStatusMessageKey,
} from './applicantDetailLabels'

type ApplicantDetailActionBarProps = {
  currentStatus: AgencyBoardStatus
  patching: boolean
  onRequestStatusChange: (status: AgencyBoardStatus) => void
}

export default function ApplicantDetailActionBar({
  currentStatus,
  patching,
  onRequestStatusChange,
}: ApplicantDetailActionBarProps) {
  const tAgency = useTranslations('agency')
  const tStatus = useTranslations('status')
  const buttons: { target: AgencyBoardStatus; label: string; primaryClass: string }[] = [
    { target: 'REVIEWING', label: tAgency('changeToReviewing'), primaryClass: 'bg-blue-600 hover:bg-blue-700' },
    { target: 'APPROVED', label: tAgency('markPass'), primaryClass: 'bg-emerald-600 hover:bg-emerald-700' },
    { target: 'REJECTED', label: tAgency('markReject'), primaryClass: 'bg-red-600 hover:bg-red-700' },
  ]
  return (
    <div className="shrink-0 space-y-3 border-t border-gray-200 bg-gray-50/80 px-4 py-4">
      <p className="whitespace-normal break-words text-sm text-gray-800">
        {tAgency('currentStatus', { status: tStatus(applicantStatusMessageKey(currentStatus)) })}
      </p>
      <div className="flex flex-col gap-2">
        {buttons.map(({ target, label, primaryClass }) => {
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
