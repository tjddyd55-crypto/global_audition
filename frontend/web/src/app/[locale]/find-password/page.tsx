'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/shared/api/auth'
import { Link } from '../../../i18n.config'

const resetSchema = z
  .object({
    recoveryCode: z.string().min(8, '복구 보안 코드를 입력해 주세요'),
    newPassword: z.string().min(6, '비밀번호는 최소 6자입니다'),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: '비밀번호가 일치하지 않습니다', path: ['confirmPassword'] })

const helpSchema = z.object({
  accountIdentifier: z.string().min(3, '계정 이메일 또는 식별자를 입력해 주세요'),
  requesterName: z.string().min(1, '이름을 입력해 주세요'),
  contact: z.string().min(3, '연락처를 입력해 주세요'),
  message: z.string().optional(),
})

export default function FindPasswordPage() {
  const [mode, setMode] = useState<'code' | 'lost'>('code')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [accountHint, setAccountHint] = useState<string | null>(null)
  const resetForm = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) })
  const helpForm = useForm<z.infer<typeof helpSchema>>({ resolver: zodResolver(helpSchema) })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold">비밀번호 찾기</h1>
        <div className="mb-4 flex gap-2">
          <button type="button" className={`min-h-11 flex-1 rounded-lg border ${mode === 'code' ? 'border-violet-600 bg-violet-50' : ''}`} onClick={() => setMode('code')}>
            복구 코드가 있어요
          </button>
          <button type="button" className={`min-h-11 flex-1 rounded-lg border ${mode === 'lost' ? 'border-violet-600 bg-violet-50' : ''}`} onClick={() => setMode('lost')}>
            코드를 잃어버렸어요
          </button>
        </div>
        {success ? <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">{success}</div> : null}
        {accountHint ? <p className="mb-3 text-sm text-gray-700">확인된 계정: {accountHint}</p> : null}
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
                setSuccess('새 비밀번호가 설정되었습니다. 새 비밀번호로 로그인해 주세요.')
              } catch (err: unknown) {
                const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                setError(message || '재설정에 실패했습니다.')
              }
            })}
          >
            <input className="w-full rounded-lg border px-4 py-2 font-mono" placeholder="복구 보안 코드" {...resetForm.register('recoveryCode')} />
            <input className="w-full rounded-lg border px-4 py-2" type="password" placeholder="새 비밀번호 (6자 이상)" {...resetForm.register('newPassword')} />
            <input className="w-full rounded-lg border px-4 py-2" type="password" placeholder="새 비밀번호 확인" {...resetForm.register('confirmPassword')} />
            <button className="min-h-11 w-full rounded-lg bg-violet-600 text-white">비밀번호 재설정</button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={helpForm.handleSubmit(async (data) => {
              setError(null)
              setSuccess(null)
              try {
                await authApi.createRecoveryHelpRequest(data)
                setSuccess('관리자에게 복구 요청이 전달되었습니다. 새 코드는 관리자가 재발급한 뒤 안내됩니다.')
              } catch (err: unknown) {
                const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                setError(message || '요청에 실패했습니다.')
              }
            })}
          >
            <input className="w-full rounded-lg border px-4 py-2" placeholder="계정 이메일" {...helpForm.register('accountIdentifier')} />
            <input className="w-full rounded-lg border px-4 py-2" placeholder="이름" {...helpForm.register('requesterName')} />
            <input className="w-full rounded-lg border px-4 py-2" placeholder="연락처" {...helpForm.register('contact')} />
            <textarea className="w-full rounded-lg border px-4 py-2" placeholder="상황 설명 (선택)" {...helpForm.register('message')} />
            <button className="min-h-11 w-full rounded-lg bg-violet-600 text-white">관리자 복구 요청</button>
          </form>
        )}
        <Link href="/login" className="mt-6 block text-center text-violet-700">로그인으로</Link>
      </div>
    </div>
  )
}
