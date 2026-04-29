'use client'

import type { AgencyBoardStatus } from '@/shared/api/auditions'
import { BTN_PRIMARY, BTN_SECONDARY } from '@/shared/ui/specClasses'

type ApplicantStatusConfirmDialogProps = {
  status: AgencyBoardStatus
  patching: boolean
  onCancel: () => void
  onConfirm: () => void
}

function confirmMessageForStatus(status: AgencyBoardStatus) {
  if (status === 'APPROVED') return '이 지원자를 합격 처리하시겠습니까?'
  if (status === 'REJECTED') return '이 지원자를 불합격 처리하시겠습니까?'
  if (status === 'REVIEWING') return '이 지원자를 검토중 상태로 변경하시겠습니까?'
  return '상태를 변경하시겠습니까?'
}

export default function ApplicantStatusConfirmDialog({
  status,
  patching,
  onCancel,
  onConfirm,
}: ApplicantStatusConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm leading-relaxed text-gray-900">{confirmMessageForStatus(status)}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={`${BTN_SECONDARY} sm:!w-auto`} onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            disabled={patching}
            className={`${BTN_PRIMARY} sm:!w-auto`}
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
