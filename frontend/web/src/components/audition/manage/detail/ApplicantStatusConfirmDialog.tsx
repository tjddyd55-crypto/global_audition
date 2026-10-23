'use client'

import { useTranslations } from 'next-intl'
import type { AgencyBoardStatus } from '@/shared/api/auditions'
import { BTN_PRIMARY, BTN_SECONDARY } from '@/shared/ui/specClasses'

type ApplicantStatusConfirmDialogProps = {
  status: AgencyBoardStatus
  patching: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ApplicantStatusConfirmDialog({
  status,
  patching,
  onCancel,
  onConfirm,
}: ApplicantStatusConfirmDialogProps) {
  const t = useTranslations('agency')
  const tCommon = useTranslations('common')
  const message =
    status === 'APPROVED'
      ? t('confirmPass')
      : status === 'REJECTED'
        ? t('confirmReject')
        : status === 'REVIEWING'
          ? t('confirmReview')
          : t('confirmChange')

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
        <p className="whitespace-normal break-words text-sm leading-relaxed text-gray-900">{message}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={`${BTN_SECONDARY} sm:!w-auto`} onClick={onCancel}>
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            disabled={patching}
            className={`${BTN_PRIMARY} sm:!w-auto`}
            onClick={onConfirm}
          >
            {tCommon('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
