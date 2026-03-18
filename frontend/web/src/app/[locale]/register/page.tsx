'use client'

import { useState } from 'react'
import { useRouter } from '../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { Link } from '../../../i18n.config'
import RoleSelectCard from '../../../components/auth/RoleSelectCard'
import AuthCardLayout from '../../../components/auth/AuthCardLayout'

const registerSchema = z.object({
  email: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .email('유효한 이메일을 입력해주세요'),
  password: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>
type RegisterRole = 'APPLICANT' | 'AGENCY'

/** 피그마: 큰 역할 선택 2개 박스 + 입력 필드 + 그라데이션 버튼. authApi.signup 유지 */
export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<RegisterRole>('APPLICANT')

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
      else if (err.response.status === 400) setError('필수값을 입력하세요')
      else if (err.response.status === 409) setError('이미 가입된 이메일입니다.')
      else setError(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCardLayout title="회원가입">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RoleSelectCard value={role} onChange={setRole} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            이메일
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
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder="6자 이상"
            className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm focus:border-purple-500 focus:outline-none"
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            placeholder="비밀번호 확인"
            className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm focus:border-purple-500 focus:outline-none"
          />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isLoading ? '처리 중...' : '회원가입'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-semibold text-purple-600 hover:underline">
          로그인
        </Link>
      </p>
    </AuthCardLayout>
  )
}
