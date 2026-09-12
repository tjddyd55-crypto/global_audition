'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { authApi } from '@/shared/api/auth'

function createMobileLoginSchema(emailInvalid: string, passwordRequired: string) {
  return z.object({
    email: z.string().email(emailInvalid),
    password: z.string().min(1, passwordRequired),
  })
}

type LoginFormData = z.infer<ReturnType<typeof createMobileLoginSchema>>

export default function MobileLoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('auth')
  const tValidation = useTranslations('validation')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createMobileLoginSchema(tValidation('emailInvalid'), t('passwordRequired'))),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.login(data)

      const token = response.token
      const userRole = response.role

      if (!response || !token) {
        setError(t('loginInvalidResponse'))
        setIsLoading(false)
        return
      }

      const savedToken = localStorage.getItem('accessToken') || localStorage.getItem('auth_token')

      if (!savedToken) {
        setError(t('tokenSaveFailed'))
        setIsLoading(false)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser', savedToken] })

      await new Promise((resolve) => setTimeout(resolve, 300))

      if (userRole === 'BUSINESS' || userRole === 'AGENCY') {
        router.push('/my/dashboard')
      } else if (userRole === 'APPLICANT' || userRole === 'USER') {
        router.push('/')
      } else {
        router.push('/')
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage = ax.response?.data?.message || ax.message || t('loginFailed')
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold">{t('loginTitle')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">{t('email')}</label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full rounded-lg border px-4 py-2"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">{t('password')}</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full rounded-lg border px-4 py-2"
              placeholder={t('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary-600 hover:bg-primary-700 w-full rounded-lg px-6 py-3 text-white disabled:opacity-50"
          >
            {isLoading ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <p className="text-gray-600">
            {t('noAccount')}{' '}
            <a href="/register" className="text-primary-600 hover:underline">
              {t('registerButton')}
            </a>
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="/find-user-id" className="hover:text-primary-600 text-gray-600">
              {t('findId')}
            </a>
            <span className="text-gray-400">|</span>
            <a href="/find-password" className="hover:text-primary-600 text-gray-600">
              {t('findPassword')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
