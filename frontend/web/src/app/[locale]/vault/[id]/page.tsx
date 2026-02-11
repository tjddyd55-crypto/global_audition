'use client'

import { useState } from 'react'
import { useParams as useNextParams } from 'next/navigation'
import { useRouter } from '../../../../i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vaultApi, type CreativeAsset } from '../../../../lib/api/vault'
import { feedbackApi, type ExpertFeedback } from '../../../../lib/api/feedback'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function AssetDetailPage() {
  const params = useNextParams()
  const router = useRouter()
  const t = useTranslations('common')
  const assetId = Number(params.id)

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => vaultApi.getAsset(assetId),
  })

  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery({
    queryKey: ['feedback', assetId],
    queryFn: () => feedbackApi.getFeedbackByAsset(assetId, { page: 0, size: 20 }),
    enabled: !!assetId,
  })

  if (assetLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">창작물을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Link href="/vault" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← 목록으로
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                {asset.assetType}
              </span>
            </div>
            <span className={`px-3 py-1 rounded text-sm ${
              asset.accessControl === 'PUBLIC' ? 'bg-green-100 text-green-800' :
              asset.accessControl === 'AUDITION_ONLY' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {asset.accessControl === 'PUBLIC' ? '공개' :
               asset.accessControl === 'AUDITION_ONLY' ? '오디션만' : '비공개'}
            </span>
          </div>

          {asset.description && (
            <p className="text-gray-700 mb-4">{asset.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-600">등록일:</span>
              <span className="ml-2">{new Date(asset.registeredAt).toLocaleString('ko-KR')}</span>
            </div>
            {asset.declaredCreationType && (
              <div>
                <span className="text-gray-600">창작 방식:</span>
                <span className="ml-2">{asset.declaredCreationType}</span>
              </div>
            )}
            {asset.fileSize && (
              <div>
                <span className="text-gray-600">파일 크기:</span>
                <span className="ml-2">{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">해시:</span>
              <span className="ml-2 font-mono text-xs">{asset.contentHash.substring(0, 16)}...</span>
            </div>
          </div>

          {asset.fileUrl && (
            <div className="mb-4">
              <a
                href={asset.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                파일 보기/다운로드 →
              </a>
            </div>
          )}

          {asset.textContent && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">텍스트 내용</h3>
              <pre className="whitespace-pre-wrap text-sm">{asset.textContent}</pre>
            </div>
          )}
        </div>

        {/* 전문가 평가 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">전문가 평가</h2>
          
          {feedbacksLoading ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : feedbacks?.content && feedbacks.content.length > 0 ? (
            <div className="space-y-4">
              {feedbacks.content.map((feedback: ExpertFeedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              아직 평가가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeedbackCard({ feedback }: { feedback: ExpertFeedback }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold">{feedback.evaluatorName || '평가자'}</span>
          <span className="ml-2 text-sm text-gray-500">
            ({feedback.evaluatorType === 'AGENCY' ? '기획사' : '인증 평가자'})
          </span>
        </div>
        {feedback.rating && (
          <div className="flex items-center">
            {'⭐'.repeat(feedback.rating)}
            <span className="ml-2 text-sm text-gray-600">{feedback.rating}/5</span>
          </div>
        )}
      </div>
      {feedback.comment && (
        <p className="text-gray-700 mb-2">{feedback.comment}</p>
      )}
      {feedback.evidenceLink && (
        <a
          href={feedback.evidenceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          증거 패키지 보기 →
        </a>
      )}
      <div className="text-xs text-gray-500 mt-2">
        {new Date(feedback.createdAt).toLocaleString('ko-KR')}
        {!feedback.isPublic && <span className="ml-2">(비공개)</span>}
      </div>
    </div>
  )
}
