'use client'

type ApplicantDetailPanelHeaderProps = {
  title?: string
  closeLabel?: string
  onClose: () => void
}

export default function ApplicantDetailPanelHeader({
  title = '지원자 상세',
  closeLabel = '닫기',
  onClose,
}: ApplicantDetailPanelHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        {closeLabel}
      </button>
    </div>
  )
}
