'use client'

type ApplicantDetailPanelStateProps = {
  message: string
  tone?: 'default' | 'danger'
}

export default function ApplicantDetailPanelState({
  message,
  tone = 'default',
}: ApplicantDetailPanelStateProps) {
  return (
    <p className={tone === 'danger' ? 'text-sm text-red-600' : 'text-sm text-gray-500'}>
      {message}
    </p>
  )
}
