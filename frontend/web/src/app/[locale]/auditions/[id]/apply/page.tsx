'use client'

import { useParams, useRouter } from '@/i18n.config'
import { useState } from 'react'
import ApplicationForm from '@/components/application/ApplicationForm'
import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import { useTranslations } from 'next-intl'

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('common')
  const auditionId = Number(params.id)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: audition } = useQuery({
    queryKey: ['audition', auditionId],
    queryFn: () => auditionApi.getAudition(auditionId),
  })

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // TODO: API 호출
      console.log('Application submitted:', data)
      router.push(`/auditions/${auditionId}`)
    } catch (error) {
      console.error('Application submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{audition.title} 지원</h1>
        <ApplicationForm auditionId={auditionId} onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
