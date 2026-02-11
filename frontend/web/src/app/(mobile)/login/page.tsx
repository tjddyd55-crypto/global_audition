'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
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
      const response = await authApi.login(data)
      
      const token = response.token
      const userRole = response.role
      
      // 로그인 성공/실패 분기 처리
      if (!response || !token) {
        setError('로그인 응답이 올바르지 않습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }
      
      // 토큰이 localStorage에 저장되었는지 확인
      const savedToken = localStorage.getItem('accessToken') || localStorage.getItem('auth_token')
      
      if (!savedToken) {
        setError('토큰 저장에 실패했습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }
      
      // 사용자 정보 쿼리 무효화하여 Header에서 즉시 반영되도록
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser', savedToken] })
      
      // auth-change 이벤트가 처리되고 Header가 업데이트될 시간을 주기 위해 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // role/userType 분기 처리 (AGENCY/BUSINESS 모두 처리)
      if (userRole === 'BUSINESS' || userRole === 'AGENCY') {
        router.push('/my/dashboard')
      } else if (userRole === 'APPLICANT' || userRole === 'USER') {
        router.push('/')
      } else {
        // 기본 처리
        router.push('/')
      }
    } catch (err: any) {
      console.error('로그인 오류:', err)
      const errorMessage = err.response?.data?.message || err.message || '로그인에 실패했습니다'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">로그인</h1>

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

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="비밀번호"
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
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600">
            계정이 없으신가요?{' '}
            <a href="/register" className="text-primary-600 hover:underline">
              회원가입
            </a>
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="/find-user-id" className="text-gray-600 hover:text-primary-600">
              아이디 찾기
            </a>
            <span className="text-gray-400">|</span>
            <a href="/find-password" className="text-gray-600 hover:text-primary-600">
              비밀번호 찾기
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
