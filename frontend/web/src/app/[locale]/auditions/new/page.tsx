'use client'

import { useState } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { auditionApi } from '../../../../lib/api/auditions'
import { Link } from '../../../../i18n.config'

const createSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED']),
})

type CreateFormData = z.infer<typeof createSchema>

export default function NewAuditionPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { status: 'DRAFT' },
  })

  const onSubmit = async (data: CreateFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await auditionApi.create({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
      })
      router.push('/auditions')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '오디션 등록에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">새 오디션 등록</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              {...register('title')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select {...register('status')} className="w-full border rounded px-3 py-2">
              <option value="DRAFT">초안 (DRAFT)</option>
              <option value="OPEN">모집중 (OPEN)</option>
              <option value="CLOSED">마감 (CLOSED)</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? '등록 중...' : '등록'}
            </button>
            <Link
              href="/auditions"
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
