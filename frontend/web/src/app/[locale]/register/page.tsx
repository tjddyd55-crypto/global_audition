'use client'

import { useState } from 'react'
import { useRouter } from '../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { Link } from '../../../i18n.config'

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string().min(6, '비밀번호 확인을 입력해주세요'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

/** 피그마: 큰 역할 선택 2개 박스 + 입력 필드 + 그라데이션 버튼. authApi.signup 유지 */
export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'APPLICANT' | 'AGENCY'>('APPLICANT')

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await authApi.signup({ email: data.email, password: data.password, role })
      if (role === 'AGENCY') router.push('/my/dashboard')
      else router.push('/auditions')
    } catch (err: any) {
      if (!err.response) setError('서버 연결 실패')
      else if (err.response.status === 400) setError(err.response.data?.message || '입력값을 확인해주세요.')
      else if (err.response.status === 409) setError('이미 가입된 이메일입니다.')
      else setError(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-white py-12 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">회원 유형</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setRole('APPLICANT')}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    role === 'APPLICANT' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                    {role === 'APPLICANT' && <span className="h-2 w-2 rounded-full bg-purple-600" />}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">지원자</div>
                    <div className="text-sm text-gray-500">오디션에 지원하고 싶어요</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('AGENCY')}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    role === 'AGENCY' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                    {role === 'AGENCY' && <span className="h-2 w-2 rounded-full bg-pink-600" />}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">기획사</div>
                    <div className="text-sm text-gray-500">기획사이며 오디션을 등록하고 싶어요</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호 (6자 이상)</label>
              <input
                id="password"
                type="password"
                {...register('password')}
                placeholder="6자 이상"
                className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="비밀번호 확인"
                className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-medium text-white shadow-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 transition-all"
            >
              {isLoading ? '처리 중...' : '가입하기'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-purple-600 font-medium hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
