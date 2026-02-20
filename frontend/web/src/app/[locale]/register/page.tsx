'use client'

import { useState } from 'react'
import { useRouter } from '../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { Link } from '../../../i18n.config'
import RoleSelector from '../../../components/auth/RoleSelector'

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirmPassword: z.string().min(8, '비밀번호 확인을 입력해주세요'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'APPLICANT' | 'AGENCY'>('APPLICANT')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await authApi.signup({
        email: data.email,
        password: data.password,
        role,
      })

      if (role === 'AGENCY') {
        router.push('/my/dashboard')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      if (!err.response) {
        setError('서버 연결 실패')
      } else if (err.response.status === 400) {
        setError(err.response.data?.message || '입력값을 확인해주세요.')
      } else if (err.response.status === 409) {
        setError('이미 가입된 이메일입니다.')
      } else {
        setError(err.response.data?.message || '회원가입에 실패했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">회원가입</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <RoleSelector role={role} onChange={setRole} />

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              {...register('email')}
              className="w-full border rounded px-3 py-2"
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              {...register('password')}
              className="w-full border rounded px-3 py-2"
              placeholder="최소 8자"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
