'use client'

import { useState } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'
import { Link } from '../../../../i18n.config'

function createAuditionSchema(titleRequired: string) {
  return z.object({
    title: z.string().min(1, titleRequired),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'OPEN', 'CLOSED']),
  })
}

type CreateFormData = z.infer<ReturnType<typeof createAuditionSchema>>

export default function NewAuditionPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const tEditor = useTranslations('editor')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createAuditionSchema(tEditor('titleRequired'))),
    defaultValues: { status: 'DRAFT' },
  })

  const onSubmit = async (data: CreateFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await auditionApi.create({
        title: data.title.trim(),
        description: (data.description ?? '').trim() || '—',
        status: data.status,
        tagIds: [],
        customTagNames: [],
        galleryImages: [],
        agencyName: tEditor('unspecified'),
        recruitFields: [],
        qualifications: [],
        schedules: [],
        benefits: [],
        location: tEditor('unspecified'),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
      router.push('/auditions')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string }
      setError(ax.response?.data?.message || ax.message || tEditor('createFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">{tEditor('createNew')}</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tEditor('title')}</label>
            <input
              type="text"
              {...register('title')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tEditor('descOptional')}</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tEditor('status')}</label>
            <select {...register('status')} className="w-full border rounded px-3 py-2">
              <option value="DRAFT">{tEditor('statusDraftParen')}</option>
              <option value="OPEN">{tEditor('statusOpenParen')}</option>
              <option value="CLOSED">{tEditor('statusClosedParen')}</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? tEditor('creating') : tEditor('createSubmit')}
            </button>
            <Link
              href="/auditions"
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              {t('cancel')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
