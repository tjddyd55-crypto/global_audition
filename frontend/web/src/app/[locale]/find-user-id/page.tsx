'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/shared/api/auth'
import { Link } from '../../../i18n.config'

const schema = z.object({
  recoveryCode: z.string().min(8, '복구 보안 코드를 입력해 주세요'),
})

export default function FindUserIdPage() {
  const [error, setError] = useState<string | null>(null)
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ recoveryCode: string }>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold">아이디 찾기</h1>
        <p className="mb-6 text-sm leading-6 text-gray-600">
          가입 때 받은 복구 보안 코드로 계정 식별자(이메일)를 확인합니다. 이름만으로는 찾지 않습니다.
        </p>
        {accountIdentifier ? (
          <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            계정 식별자: <strong>{accountIdentifier}</strong>
          </div>
        ) : null}
        <form
          className="space-y-6"
          onSubmit={handleSubmit(async (data) => {
            setIsLoading(true)
            setError(null)
            try {
              const res = await authApi.identifyByRecoveryCode(data.recoveryCode)
              setAccountIdentifier(res.accountIdentifier)
            } catch (err: unknown) {
              const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
              setError(message || '복구 코드를 확인할 수 없습니다.')
            } finally {
              setIsLoading(false)
            }
          })}
        >
          {error ? <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div> : null}
          <div>
            <label className="mb-2 block text-sm font-medium">복구 보안 코드</label>
            <input className="w-full rounded-lg border px-4 py-2 font-mono" placeholder="XXXX-XXXX-XXXX" {...register('recoveryCode')} />
            {errors.recoveryCode ? <p className="mt-1 text-sm text-red-500">{errors.recoveryCode.message}</p> : null}
          </div>
          <button disabled={isLoading} className="w-full rounded-lg bg-violet-600 px-6 py-3 text-white disabled:opacity-50">
            {isLoading ? '확인 중...' : '계정 확인'}
          </button>
        </form>
        <div className="mt-6 space-y-2 text-center">
          <Link href="/find-password" className="block text-violet-700">비밀번호 재설정</Link>
          <Link href="/login" className="block text-gray-600">로그인</Link>
        </div>
      </div>
    </div>
  )
}
