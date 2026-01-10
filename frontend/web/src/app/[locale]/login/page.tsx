'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await authApi.login(data)
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.message || t('loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'GOOGLE' | 'KAKAO' | 'NAVER' | 'FACEBOOK') => {
    setIsLoading(true)
    setError(null)
    try {
      // 소셜 로그인 SDK를 사용하여 액세스 토큰 획득
      // 여기서는 각 소셜 로그인 제공자의 SDK를 사용해야 합니다
      // 예시: Google의 경우 @react-oauth/google, Kakao의 경우 @react-kakao/login 등
      
      // 임시로 사용자에게 안내 메시지 표시
      alert(`${provider} 소셜 로그인은 현재 개발 중입니다. 각 소셜 로그인 SDK를 설정한 후 사용할 수 있습니다.`)
      
      // 실제 구현 예시:
      // const accessToken = await getSocialAccessToken(provider)
      // await authApi.socialLogin(provider, accessToken, 'APPLICANT')
      // router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.message || `${provider} 로그인에 실패했습니다`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">{t('loginTitle')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{t('email')}</label>
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

          <div>
            <label className="block text-sm font-medium mb-2">{t('password')}</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={t('password')}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? tCommon('loading') : t('loginButton')}
          </button>
        </form>

        {/* 소셜 로그인 구분선 */}
        <div className="mt-6 mb-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">{t('or') || '또는'}</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('GOOGLE')}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google로 로그인</span>
          </button>

          <button
            onClick={() => handleSocialLogin('KAKAO')}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-[#FEE500] text-[#000000] rounded-lg hover:bg-[#FDD835] disabled:opacity-50 flex items-center justify-center gap-3 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
            </svg>
            <span>카카오로 로그인</span>
          </button>

          <button
            onClick={() => handleSocialLogin('NAVER')}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-[#03C75A] text-white rounded-lg hover:bg-[#02B350] disabled:opacity-50 flex items-center justify-center gap-3 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"/>
            </svg>
            <span>네이버로 로그인</span>
          </button>

          <button
            onClick={() => handleSocialLogin('FACEBOOK')}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] disabled:opacity-50 flex items-center justify-center gap-3 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook으로 로그인</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary-600 hover:underline">
              {t('registerButton')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
