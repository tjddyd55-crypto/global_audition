'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/shared/api/user'
import { authApi } from '@/shared/api/auth'
import { useTranslations } from 'next-intl'
import { AgencyDashboardShell } from '@/components/agency/AgencyDashboardShell'

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
  const tProfile = useTranslations('myProfile')
  const tValidation = useTranslations('validation')
  const tEditor = useTranslations('editor')
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
        if (user.role !== 'AGENCY' && user.role !== 'ADMIN') {
          router.push('/')
          return
        }

        setUserType('BUSINESS')
        // TODO: 기획사 프로필 정보 로드 및 폼 초기화
        // reset({ ...userProfile })
      } catch (err: unknown) {
        console.error('Auth check failed:', err)
        const ax = err as { response?: { status?: number } }
        if (ax.response?.status === 401) {
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
      alert(tProfile('updated'))
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
    <AgencyDashboardShell>
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-4xl border border-gray-200 bg-white p-8">
        <h1 className="text-3xl font-bold mb-8">{tProfile('title')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">{tProfile('companyName')}</label>
            <input
              type="text"
              {...register('companyName', { required: tProfile('companyRequired') })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tProfile('companyPlaceholder')}
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tProfile('representative')}</label>
            <input
              type="text"
              {...register('name', { required: tProfile('representativeRequired') })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tProfile('representativePlaceholder')}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tProfile('emailRequired')}</label>
            <input
              type="email"
              {...register('email', {
                required: tProfile('emailRequiredMsg'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: tValidation('emailInvalid'),
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
              <label className="block text-sm font-medium mb-2">{tProfile('country')}</label>
              <input
                type="text"
                {...register('country')}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="KR"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{tProfile('city')}</label>
              <input
                type="text"
                {...register('city')}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={tProfile('cityPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tProfile('address')}</label>
            <input
              type="text"
              {...register('address')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tProfile('address')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tProfile('website')}</label>
            <input
              type="url"
              {...register('website')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tProfile('contactEmail')}</label>
            <input
              type="email"
              {...register('contactEmail')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tProfile('contactPhone')}</label>
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
              {updateMutation.isPending ? tEditor('saving') : t('save')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </AgencyDashboardShell>
  )
}
