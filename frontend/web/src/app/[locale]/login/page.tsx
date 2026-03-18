'use client'

import { useState } from 'react'
import { useRouter } from '../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '../../../i18n.config'
import AuthCardLayout from '../../../components/auth/AuthCardLayout'

const loginSchema = z.object({
  email: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .email('유효한 이메일을 입력해주세요'),
  password: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('auth')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [socialMessage, setSocialMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setSocialMessage(null)
    setError(null)
    try {
      const response = await authApi.login(data)
      const token = response.token
      const userRole = response.role
      if (!response || !token) {
        setError('로그인 응답이 올바르지 않습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }

      const savedToken = localStorage.getItem('accessToken') || localStorage.getItem('auth_token')
      if (!savedToken) {
        setError('토큰 저장에 실패했습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser', savedToken] })

      await new Promise(resolve => setTimeout(resolve, 300))

      if (userRole === 'BUSINESS' || userRole === 'AGENCY') {
        router.push('/my/dashboard')
      } else if (userRole === 'APPLICANT' || userRole === 'USER') {
        router.push('/')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      if (!err.response) {
        setError('서버 연결 실패')
      } else {
        const status = err.response.status
        if (status === 401 || status === 403) setError('이메일 또는 비밀번호가 올바르지 않습니다')
        else if (status === 400) setError('필수값을 입력하세요')
        else setError(err.response?.data?.message || t('loginError'))
      }

      setIsLoading(false)
    }
  }

  const handleSocialClick = () => {
    setSocialMessage('소셜 로그인은 준비 중입니다')
  }

  return (
    <AuthCardLayout title={t('loginTitle')}>
      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {socialMessage && (
        <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          {socialMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="your@email.com"
            className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm focus:border-purple-500 focus:outline-none"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm focus:border-purple-500 focus:outline-none"
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isLoading ? '처리 중...' : t('loginButton')}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-sm text-gray-500">또는</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {['Google', '카카오', '네이버', 'Facebook'].map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={handleSocialClick}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            {provider}
          </button>
        ))}
      </div>

      <div className="mt-5 text-center text-sm">
        <p className="text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/register" className="font-semibold text-purple-600 hover:underline">
            회원가입
          </Link>
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-3 text-gray-600">
          <Link href="/find-user-id" className="hover:text-purple-600">
            아이디 찾기
          </Link>
          <span>·</span>
          <Link href="/find-password" className="hover:text-purple-600">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </AuthCardLayout>
  )
}
