'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const applicationSchema = z.object({
  videoId1: z.number().min(1, '비디오를 선택해주세요'),
  videoId2: z.number().optional(),
  photos: z.array(z.string().url()).min(3, '최소 3장의 사진이 필요합니다'),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface ApplicationFormProps {
  auditionId: number
  onSubmit: (data: ApplicationFormData) => Promise<void>
}

export default function ApplicationForm({ auditionId, onSubmit }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })

  const onFormSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          비디오 1 <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          {...register('videoId1', { valueAsNumber: true })}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="비디오 ID"
        />
        {errors.videoId1 && (
          <p className="text-red-500 text-sm mt-1">{errors.videoId1.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">비디오 2 (선택)</label>
        <input
          type="number"
          {...register('videoId2', { valueAsNumber: true })}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="비디오 ID"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          사진 (최소 3장) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('photos.0')}
          className="w-full px-4 py-2 border rounded-lg mb-2"
          placeholder="사진 URL 1"
        />
        <input
          type="text"
          {...register('photos.1')}
          className="w-full px-4 py-2 border rounded-lg mb-2"
          placeholder="사진 URL 2"
        />
        <input
          type="text"
          {...register('photos.2')}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="사진 URL 3"
        />
        {errors.photos && (
          <p className="text-red-500 text-sm mt-1">{errors.photos.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '제출 중...' : '지원하기'}
      </button>
    </form>
  )
}
