'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { authApi } from '@/shared/api/auth'
import { Link } from '../../../i18n.config'

function createIdentifySchema(required: string) {
  return z.object({
    recoveryCode: z.string().min(8, required),
  })
}

export default function FindUserIdPage() {
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const schema = useMemo(() => createIdentifySchema(tAuth('recoveryCodeRequired')), [tAuth])
  const [error, setError] = useState<string | null>(null)
  const [accountIdentifier, setAccountIdentifier] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ recoveryCode: string }>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold">{tAuth('identify')}</h1>
        <p className="mb-6 text-sm leading-6 text-gray-600">
          {tAuth('identifyHint')}
        </p>
        {accountIdentifier ? (
          <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {tAuth('accountIdentifierLine', { id: accountIdentifier })}
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
              setError(message || tAuth('identifyFailed'))
            } finally {
              setIsLoading(false)
            }
          })}
        >
          {error ? <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div> : null}
          <div>
            <label className="mb-2 block text-sm font-medium">{tAuth('recoveryCode')}</label>
            <input className="w-full rounded-lg border px-4 py-2 font-mono" placeholder="XXXX-XXXX-XXXX" {...register('recoveryCode')} />
            {errors.recoveryCode ? <p className="mt-1 text-sm text-red-500">{errors.recoveryCode.message}</p> : null}
          </div>
          <button disabled={isLoading} className="w-full rounded-lg bg-violet-600 px-6 py-3 text-white disabled:opacity-50">
            {isLoading ? tAuth('checking') : tAuth('confirmAccount')}
          </button>
        </form>
        <div className="mt-6 space-y-2 text-center">
          <Link href="/find-password" className="block text-violet-700">{tAuth('resetPassword')}</Link>
          <Link href="/login" className="block text-gray-600">{tCommon('login')}</Link>
        </div>
      </div>
    </div>
  )
}
