'use client'

type ApplicantManagementPageStateProps = {
  message: string
  tone?: 'default' | 'danger'
}

export default function ApplicantManagementPageState({
  message,
  tone = 'default',
}: ApplicantManagementPageStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className={tone === 'danger' ? 'text-lg text-red-600' : 'text-lg font-medium text-gray-900'}>
        {message}
      </p>
    </div>
  )
}
