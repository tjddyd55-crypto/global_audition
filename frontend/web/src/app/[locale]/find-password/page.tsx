'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '../../../i18n.config'

const forgotPasswordSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function FindPasswordPage() {
  const t = useTranslations('auth')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setResetToken(null)

    try {
      const response = await authApi.forgotPassword(data)
      setSuccess(response.message)
      // 개발 단계에서는 토큰을 응답에 포함
      if (response.resetToken) {
        setResetToken(response.resetToken)
      } else {
        // 실제 환경에서는 이메일로 전송되므로 여기서 토큰을 입력받도록 안내
        setSuccess('비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '입력하신 이메일로 등록된 계정을 찾을 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">비밀번호 찾기</h1>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold mb-2">{success}</p>
            {resetToken && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-semibold mb-2">개발 단계: 재설정 토큰</p>
                <p className="text-xs break-all mb-3">{resetToken}</p>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  비밀번호 재설정 페이지로 이동
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">이메일</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? '전송 중...' : '재설정 토큰 받기'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link href="/login" className="text-primary-600 hover:text-primary-800 block">
            로그인으로 돌아가기
          </Link>
          <Link href="/find-user-id" className="text-gray-600 hover:text-gray-800 block">
            아이디 찾기
          </Link>
        </div>
      </div>
    </div>
  )
}
