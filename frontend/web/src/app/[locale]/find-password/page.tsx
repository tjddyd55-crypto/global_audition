'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { authApi } from '@/shared/api/auth'
import { Link } from '../../../i18n.config'
import { mapApiErrorCode } from '@/shared/i18n/mapApiError'

export default function FindPasswordPage() {
  const t = useTranslations('auth')
  const tErr = useTranslations()
  const [mode, setMode] = useState<'code' | 'lost'>('code')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [accountHint, setAccountHint] = useState<string | null>(null)

  const resetSchema = useMemo(
    () =>
      z
        .object({
          recoveryCode: z.string().min(8, t('recoveryCodePlaceholder')),
          newPassword: z.string().min(6, t('passwordTooShort')),
          confirmPassword: z.string().min(6),
        })
        .refine((d) => d.newPassword === d.confirmPassword, { message: t('passwordMismatch'), path: ['confirmPassword'] }),
    [t],
  )
  const helpSchema = useMemo(
    () =>
      z.object({
        accountIdentifier: z.string().min(3, t('accountEmailOrId')),
        requesterName: z.string().min(1, t('nameRequired')),
        contact: z.string().min(3, t('contactRequired')),
        message: z.string().optional(),
      }),
    [t],
  )

  const resetForm = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) })
  const helpForm = useForm<z.infer<typeof helpSchema>>({ resolver: zodResolver(helpSchema) })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold">{t('findPassword')}</h1>
        <div className="mb-4 flex gap-2">
          <button type="button" className={`min-h-11 flex-1 rounded-lg border ${mode === 'code' ? 'border-violet-600 bg-violet-50' : ''}`} onClick={() => setMode('code')}>
            {t('hasRecoveryCode')}
          </button>
          <button type="button" className={`min-h-11 flex-1 rounded-lg border ${mode === 'lost' ? 'border-violet-600 bg-violet-50' : ''}`} onClick={() => setMode('lost')}>
            {t('lostRecoveryCode')}
          </button>
        </div>
        {success ? <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">{success}</div> : null}
        {accountHint ? <p className="mb-3 text-sm text-gray-700">{t('confirmedAccount', { id: accountHint })}</p> : null}
        {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div> : null}

        {mode === 'code' ? (
          <form
            className="space-y-4"
            onSubmit={resetForm.handleSubmit(async (data) => {
              setError(null)
              setSuccess(null)
              try {
                const id = await authApi.identifyByRecoveryCode(data.recoveryCode)
                setAccountHint(id.accountIdentifier)
                await authApi.resetPasswordWithRecoveryCode(data.recoveryCode, data.newPassword)
                setSuccess(t('loginAfterReset'))
              } catch (err: unknown) {
                const data = (err as { response?: { data?: unknown } })?.response?.data
                setError(mapApiErrorCode(data, (key) => tErr(key), t('resetFailed')))
              }
            })}
          >
            <input className="w-full rounded-lg border px-4 py-2 font-mono" placeholder={t('recoveryCodePlaceholder')} {...resetForm.register('recoveryCode')} />
            <input className="w-full rounded-lg border px-4 py-2" type="password" placeholder={t('newPasswordMin6')} {...resetForm.register('newPassword')} />
            <input className="w-full rounded-lg border px-4 py-2" type="password" placeholder={t('confirmNewPassword')} {...resetForm.register('confirmPassword')} />
            <button className="min-h-11 w-full rounded-lg bg-violet-600 text-white">{t('resetPassword')}</button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={helpForm.handleSubmit(async (data) => {
              setError(null)
              setSuccess(null)
              try {
                await authApi.createRecoveryHelpRequest(data)
                setSuccess(t('recoveryRequestedAdmin'))
              } catch (err: unknown) {
                const data = (err as { response?: { data?: unknown } })?.response?.data
                setError(mapApiErrorCode(data, (key) => tErr(key), t('requestFailed')))
              }
            })}
          >
            <input className="w-full rounded-lg border px-4 py-2" placeholder={t('accountEmail')} {...helpForm.register('accountIdentifier')} />
            <input className="w-full rounded-lg border px-4 py-2" placeholder={t('name')} {...helpForm.register('requesterName')} />
            <input className="w-full rounded-lg border px-4 py-2" placeholder={t('contact')} {...helpForm.register('contact')} />
            <textarea className="w-full rounded-lg border px-4 py-2" placeholder={t('situationOptional')} {...helpForm.register('message')} />
            <button className="min-h-11 w-full rounded-lg bg-violet-600 text-white">{t('requestAdminRecovery')}</button>
          </form>
        )}
        <Link href="/login" className="mt-6 block text-center text-violet-700">
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  )
}
