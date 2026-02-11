'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../../../../lib/api/user'
import { authApi } from '../../../../lib/api/auth'
import { useTranslations } from 'next-intl'

interface BusinessProfileForm {
  name: string
  email: string
  companyName?: string
  country?: string
  city?: string
  address?: string
  website?: string
  contactEmail?: string
  contactPhone?: string
}

export default function BusinessProfilePage() {
  const router = useRouter()
  const t = useTranslations('common')
  const queryClient = useQueryClient()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BusinessProfileForm>()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authApi.getToken()
        if (!token) {
          router.push('/login')
          return
        }

        const user = await userApi.getCurrentUser()
        if (user.userType !== 'BUSINESS') {
          router.push('/')
          return
        }

        setUserType(user.userType)
        // TODO: 기획사 프로필 정보 로드 및 폼 초기화
        // reset({ ...userProfile })
      } catch (err: any) {
        console.error('Auth check failed:', err)
        if (err.response?.status === 401) {
          router.push('/login')
        }
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, reset])

  const updateMutation = useMutation({
    mutationFn: async (data: BusinessProfileForm) => {
      // TODO: 기획사 프로필 업데이트 API 호출
      // return await userApi.updateBusinessProfile(data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      alert('프로필이 업데이트되었습니다')
    },
  })

  const onSubmit = async (data: BusinessProfileForm) => {
    try {
      await updateMutation.mutateAsync(data)
    } catch (error) {
      console.error('Profile update failed:', error)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (userType !== 'BUSINESS') {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8">내 정보 관리</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">기업명 *</label>
            <input
              type="text"
              {...register('companyName', { required: '기업명을 입력해주세요' })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="기업명"
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">대표자명 *</label>
            <input
              type="text"
              {...register('name', { required: '대표자명을 입력해주세요' })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="대표자명"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이메일 *</label>
            <input
              type="email"
              {...register('email', {
                required: '이메일을 입력해주세요',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '유효한 이메일을 입력해주세요',
                },
              })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">국가</label>
              <input
                type="text"
                {...register('country')}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="KR"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">도시</label>
              <input
                type="text"
                {...register('city')}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="서울"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">주소</label>
            <input
              type="text"
              {...register('address')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="주소"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">웹사이트</label>
            <input
              type="url"
              {...register('website')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">연락 이메일</label>
            <input
              type="email"
              {...register('contactEmail')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">연락처</label>
            <input
              type="tel"
              {...register('contactPhone')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="010-1234-5678"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
