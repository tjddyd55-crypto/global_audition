'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { vaultApi, type CreativeAsset } from '../../lib/api/vault'

const applicationSchema = z.object({
  videoId1: z.number().optional(),
  videoId2: z.number().optional(),
  photos: z.array(z.string().url()).optional(),
  assetIds: z.array(z.number()).optional(), // Creative Vault asset_id 목록
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface ApplicationFormProps {
  auditionId: number
  onSubmit: (data: ApplicationFormData) => Promise<void>
}

export default function ApplicationForm({ auditionId, onSubmit }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([])

  // 내 Vault 자산 목록 조회
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
      // assetIds 추가
      const submitData = {
        ...data,
        assetIds: selectedAssetIds.length > 0 ? selectedAssetIds : undefined,
      }
      await onSubmit(submitData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssetToggle = (assetId: number) => {
    const newSelected = selectedAssetIds.includes(assetId)
      ? selectedAssetIds.filter(id => id !== assetId)
      : [...selectedAssetIds, assetId]
    setSelectedAssetIds(newSelected)
    setValue('assetIds', newSelected)
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

      {/* Creative Vault 자산 선택 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">
            창작물 첨부 (Vault에서 선택)
          </label>
          <button
            type="button"
            onClick={() => setShowVaultSelector(!showVaultSelector)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showVaultSelector ? '닫기' : 'Vault 열기'}
          </button>
        </div>
        {showVaultSelector && (
          <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
            {myAssets?.content && myAssets.content.length > 0 ? (
              <div className="space-y-2">
                {myAssets.content.map((asset: CreativeAsset) => (
                  <label
                    key={asset.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded"
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
              <p className="text-sm text-gray-500 text-center py-4">
                등록된 창작물이 없습니다. <a href="/vault" className="text-blue-600 hover:underline">Vault에서 등록하기</a>
              </p>
            )}
          </div>
        )}
        {selectedAssetIds.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            선택된 창작물: {selectedAssetIds.length}개
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">사진 (선택)</label>
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
