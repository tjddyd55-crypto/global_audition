'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '../../../i18n.config'

export default function ResetPasswordPage() {
  const tCommon = useTranslations('common')
  const router = useRouter()
  router.replace('/find-password')
  return (
    <div className="flex min-h-screen items-center justify-center p-4 text-sm text-gray-600">
      {tCommon('redirectingRecovery')}
    </div>
  )
}
