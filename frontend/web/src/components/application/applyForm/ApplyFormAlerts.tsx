'use client'

import { useTranslations } from 'next-intl'

type ApplyFormAlertsProps = {
  profileAutofillNotice: boolean
  formError: string | null
}

export default function ApplyFormAlerts({ profileAutofillNotice, formError }: ApplyFormAlertsProps) {
  const t = useTranslations('apply')
  return (
    <>
      {profileAutofillNotice ? (
        <div className="whitespace-normal break-words rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          {t('autofillNotice')}
        </div>
      ) : null}
      {formError ? (
        <div className="whitespace-normal break-words rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}
    </>
  )
}
