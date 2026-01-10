'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { auditionApi } from '@/lib/api/auditions'
import { userApi } from '@/lib/api/user'
import { authApi } from '@/lib/api/auth'
import { useTranslations } from 'next-intl'
import { AuditionCategory, AuditionStatus } from '@/types'

const auditionSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  titleEn: z.string().optional(),
  category: z.nativeEnum(AuditionCategory, {
    errorMap: () => ({ message: '카테고리를 선택해주세요' }),
  }),
  description: z.string().optional(),
  requirements: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '시작일 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '종료일 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  screeningDate1: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '1차 심사일 형식이 올바르지 않습니다').optional().or(z.literal('')),
  screeningDate2: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '2차 심사일 형식이 올바르지 않습니다').optional().or(z.literal('')),
  screeningDate3: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '3차 심사일 형식이 올바르지 않습니다').optional().or(z.literal('')),
  bannerUrl: z.string().url('유효한 URL을 입력해주세요').optional().or(z.literal('')),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end >= start
}, {
  message: '종료일은 시작일보다 늦어야 합니다',
  path: ['endDate'],
})

type AuditionFormData = z.infer<typeof auditionSchema>

export default function CreateAuditionPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuditionFormData>({
    resolver: zodResolver(auditionSchema),
  })

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
          setError('기획사만 오디션 공고를 작성할 수 있습니다')
          setTimeout(() => router.push('/'), 2000)
          return
        }

        setUserType(user.userType)
      } catch (err: any) {
        console.error('Auth check failed:', err)
        if (err.response?.status === 401) {
          router.push('/login')
        } else {
          setError('사용자 정보를 불러올 수 없습니다')
        }
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const onSubmit = async (data: AuditionFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const auditionData = {
        ...data,
        status: AuditionStatus.WAITING_OPENING,
        screeningDate1: data.screeningDate1 || undefined,
        screeningDate2: data.screeningDate2 || undefined,
        screeningDate3: data.screeningDate3 || undefined,
        bannerUrl: data.bannerUrl || undefined,
      }

      await auditionApi.createAudition(auditionData)
      router.push('/auditions')
    } catch (err: any) {
      console.error('Create audition failed:', err)
      setError(err.response?.data?.message || '오디션 공고 작성에 실패했습니다')
    } finally {
      setIsLoading(false)
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">
          {error || '기획사만 오디션 공고를 작성할 수 있습니다'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">오디션 공고 작성</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="오디션 제목"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">제목 (영문)</label>
            <input
              type="text"
              {...register('titleEn')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Audition Title (English)"
            />
            {errors.titleEn && (
              <p className="text-red-500 text-sm mt-1">{errors.titleEn.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">카테고리 *</label>
            <select
              {...register('category')}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">카테고리를 선택하세요</option>
              <option value={AuditionCategory.SINGER}>가수</option>
              <option value={AuditionCategory.DANCER}>댄서</option>
              <option value={AuditionCategory.ACTOR}>배우</option>
              <option value={AuditionCategory.MODEL}>모델</option>
              <option value={AuditionCategory.INSTRUMENT}>연주자</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">상세 설명</label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="오디션에 대한 상세한 설명을 입력해주세요"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">지원 자격</label>
            <textarea
              {...register('requirements')}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="지원 자격 요건을 입력해주세요"
            />
            {errors.requirements && (
              <p className="text-red-500 text-sm mt-1">{errors.requirements.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">모집 시작일 *</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">모집 종료일 *</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">1차 심사일</label>
              <input
                type="date"
                {...register('screeningDate1')}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.screeningDate1 && (
                <p className="text-red-500 text-sm mt-1">{errors.screeningDate1.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">2차 심사일</label>
              <input
                type="date"
                {...register('screeningDate2')}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.screeningDate2 && (
                <p className="text-red-500 text-sm mt-1">{errors.screeningDate2.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">3차 심사일</label>
              <input
                type="date"
                {...register('screeningDate3')}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.screeningDate3 && (
                <p className="text-red-500 text-sm mt-1">{errors.screeningDate3.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">배너 이미지 URL</label>
            <input
              type="url"
              {...register('bannerUrl')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://example.com/banner.jpg"
            />
            {errors.bannerUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.bannerUrl.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? '작성 중...' : '공고 등록'}
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
