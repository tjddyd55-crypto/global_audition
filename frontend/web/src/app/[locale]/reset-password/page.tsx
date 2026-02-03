'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '../../../i18n.config'

const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, '재설정 토큰을 입력해주세요'),
    newPassword: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
    confirmPassword: z.string().min(8, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetToken: '',
    },
  })

  // URL에서 토큰 가져오기
  useEffect(() => {
    const token = searchParams?.get('token')
    if (token) {
      setValue('resetToken', token)
    }
  }, [searchParams, setValue])

  const resetToken = watch('resetToken')

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await authApi.resetPassword(data)
      setSuccess('비밀번호가 성공적으로 재설정되었습니다')
      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 재설정에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">비밀번호 재설정</h1>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">{success}</p>
            <p className="text-sm mt-2">잠시 후 로그인 페이지로 이동합니다...</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">재설정 토큰</label>
            <input
              type="text"
              {...register('resetToken')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="재설정 토큰을 입력해주세요"
              readOnly={!!searchParams?.get('token')}
            />
            {errors.resetToken && (
              <p className="text-red-500 text-sm mt-1">{errors.resetToken.message}</p>
            )}
            {!resetToken && (
              <p className="text-gray-500 text-xs mt-1">
                비밀번호 찾기 페이지에서 받은 토큰을 입력해주세요
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">새 비밀번호</label>
            <input
              type="password"
              {...register('newPassword')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="새 비밀번호를 입력해주세요 (최소 8자)"
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호 확인</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="비밀번호를 다시 입력해주세요"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !resetToken}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? '재설정 중...' : '비밀번호 재설정'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link href="/login" className="text-primary-600 hover:text-primary-800 block">
            로그인으로 돌아가기
          </Link>
          <Link href="/find-password" className="text-gray-600 hover:text-gray-800 block">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-xl">로딩 중...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
