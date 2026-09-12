'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { vaultApi, type CreativeAsset } from '@/shared/api/vault'

const applicationSchema = z.object({
  videoId1: z.number().optional(),
  videoId2: z.number().optional(),
  photos: z.array(z.string().url()).optional(),
  assetIds: z.array(z.string()).optional(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface ApplicationFormProps {
  auditionId: number
  onSubmit: (data: ApplicationFormData) => Promise<void>
}

export default function ApplicationForm({ auditionId: _auditionId, onSubmit }: ApplicationFormProps) {
  const t = useTranslations('apply')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])

  const { data: myAssets } = useQuery({
    queryKey: ['myAssets'],
    queryFn: () => vaultApi.getMyAssets({ page: 0, size: 100 }),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })

  const onFormSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    try {
      const submitData = {
        ...data,
        assetIds: selectedAssetIds.length > 0 ? selectedAssetIds : undefined,
      }
      await onSubmit(submitData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssetToggle = (assetId: string) => {
    const newSelected = selectedAssetIds.includes(assetId)
      ? selectedAssetIds.filter((id) => id !== assetId)
      : [...selectedAssetIds, assetId]
    setSelectedAssetIds(newSelected)
    setValue('assetIds', newSelected)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t('video1')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          {...register('videoId1', { valueAsNumber: true })}
          className="w-full rounded-lg border px-4 py-2"
          placeholder={t('videoIdPlaceholder')}
        />
        {errors.videoId1 && (
          <p className="mt-1 text-sm text-red-500">{errors.videoId1.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">{t('video2Optional')}</label>
        <input
          type="number"
          {...register('videoId2', { valueAsNumber: true })}
          className="w-full rounded-lg border px-4 py-2"
          placeholder={t('videoIdPlaceholder')}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block whitespace-normal break-words text-sm font-medium">
            {t('vaultAttach')}
          </label>
          <button
            type="button"
            onClick={() => setShowVaultSelector(!showVaultSelector)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showVaultSelector ? tCommon('close') : t('vaultOpen')}
          </button>
        </div>
        {showVaultSelector && (
          <div className="max-h-60 overflow-y-auto rounded-lg border bg-gray-50 p-4">
            {myAssets?.content && myAssets.content.length > 0 ? (
              <div className="space-y-2">
                {myAssets.content.map((asset: CreativeAsset) => (
                  <label
                    key={asset.id}
                    className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => handleAssetToggle(asset.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{asset.title}</span>
                      <span className="ml-2 text-xs text-gray-500">({asset.assetType})</span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">
                {t('vaultEmptyCta')}{' '}
                <a href="/vault" className="text-blue-600 hover:underline">
                  {t('vaultRegisterCta')}
                </a>
              </p>
            )}
          </div>
        )}
        {selectedAssetIds.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {t('selectedAssets', { n: selectedAssetIds.length })}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">{t('photosOptional')}</label>
        <input
          type="text"
          {...register('photos.0')}
          className="mb-2 w-full rounded-lg border px-4 py-2"
          placeholder={t('photoUrlN', { n: 1 })}
        />
        <input
          type="text"
          {...register('photos.1')}
          className="mb-2 w-full rounded-lg border px-4 py-2"
          placeholder={t('photoUrlN', { n: 2 })}
        />
        <input
          type="text"
          {...register('photos.2')}
          className="w-full rounded-lg border px-4 py-2"
          placeholder={t('photoUrlN', { n: 3 })}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary-600 hover:bg-primary-700 w-full rounded-lg px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? t('submitting') : t('title')}
      </button>
    </form>
  )
}
