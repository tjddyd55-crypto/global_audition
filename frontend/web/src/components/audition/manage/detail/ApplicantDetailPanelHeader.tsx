'use client'

import { useTranslations } from 'next-intl'

type ApplicantDetailPanelHeaderProps = {
  title?: string
  closeLabel?: string
  onClose: () => void
}

export default function ApplicantDetailPanelHeader({
  title,
  closeLabel,
  onClose,
}: ApplicantDetailPanelHeaderProps) {
  const t = useTranslations('common')
  const tAgency = useTranslations('agency')

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
      <h2 className="text-lg font-bold text-gray-900">{title ?? tAgency('detail')}</h2>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        {closeLabel ?? t('close')}
      </button>
    </div>
  )
}
