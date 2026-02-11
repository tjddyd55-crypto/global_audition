'use client'

import { useState } from 'react'
import { useRouter } from '../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { Link } from '../../../i18n.config'

const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string().min(6, '비밀번호 확인을 입력해주세요'),
  role: z.enum(['APPLICANT', 'AGENCY']),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'APPLICANT' },
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await authApi.signup({
        email: data.email,
        password: data.password,
        role: data.role,
      })
      if (data.role === 'AGENCY') router.push('/my/dashboard')
      else router.push('/auditions')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              {...register('email')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (6자 이상)</label>
            <input
              type="password"
              {...register('password')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select {...register('role')} className="w-full border rounded px-3 py-2">
              <option value="APPLICANT">지망생 (Applicant)</option>
              <option value="AGENCY">기획사 (Agency)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '가입하기'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요? <Link href="/login" className="text-primary-600 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  )
}
