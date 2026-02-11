'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '../../../i18n.config'

const findUserIdSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

type FindUserIdFormData = z.infer<typeof findUserIdSchema>

export default function FindUserIdPage() {
  const t = useTranslations('auth')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindUserIdFormData>({
    resolver: zodResolver(findUserIdSchema),
  })

  const onSubmit = async (data: FindUserIdFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setMaskedEmail(null)

    try {
      const response = await authApi.findUserId(data)
      setMaskedEmail(response.maskedEmail)
      setSuccess('입력하신 정보와 일치하는 계정을 찾았습니다')
    } catch (err: any) {
      setError(err.response?.data?.message || '입력하신 정보와 일치하는 계정을 찾을 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">아이디 찾기</h1>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold mb-2">{success}</p>
            {maskedEmail && (
              <p className="text-lg">
                등록된 이메일: <span className="font-bold">{maskedEmail}</span>
              </p>
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
            <label className="block text-sm font-medium mb-2">이름</label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="이름을 입력해주세요"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

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
            {isLoading ? '찾는 중...' : '아이디 찾기'}
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
