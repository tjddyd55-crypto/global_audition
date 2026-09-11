'use client'

import { useRouter } from '../../../i18n.config'

export default function ResetPasswordPage() {
  const router = useRouter()
  router.replace('/find-password')
  return (
    <div className="flex min-h-screen items-center justify-center p-4 text-sm text-gray-600">
      비밀번호 재설정은 복구 보안 코드 화면으로 이동합니다…
    </div>
  )
}
