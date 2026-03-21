'use client'

import { useParams as useNextParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { vaultApi, type CreativeAsset } from '../../../../lib/api/vault'
import { feedbackApi, type ExpertFeedback } from '../../../../lib/api/feedback'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../i18n.config'
import { CARD_BASE, PAGE_CONTAINER, SECTION_GAP, TEXT_SUB, TITLE_PAGE } from '@/lib/ui/specClasses'

export default function AssetDetailPage() {
  const params = useNextParams()
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-semibold text-gray-900">{t('loading')}</div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-semibold text-gray-900">창작물을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <Link href="/vault" className="text-sm font-medium text-[#3B82F6] no-underline">
          ← 목록으로
        </Link>

        <div className={CARD_BASE}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className={TITLE_PAGE}>{asset.title}</h1>
              <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{asset.assetType}</span>
            </div>
            <span
              className={
                asset.accessControl === 'PUBLIC'
                  ? 'rounded-full bg-green-50 px-3 py-1 text-sm text-green-700'
                  : asset.accessControl === 'AUDITION_ONLY'
                    ? 'rounded-full bg-yellow-50 px-3 py-1 text-sm text-yellow-800'
                    : 'rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
              }
            >
              {asset.accessControl === 'PUBLIC' ? '공개' : asset.accessControl === 'AUDITION_ONLY' ? '오디션만' : '비공개'}
            </span>
          </div>

          {asset.description ? <p className="mb-4 text-sm text-gray-700">{asset.description}</p> : null}

          <div className="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className={TEXT_SUB}>등록일:</span>
              <span className="ml-2 text-sm text-gray-900">{new Date(asset.registeredAt).toLocaleDateString('ko-KR')}</span>
            </div>
            {asset.declaredCreationType ? (
              <div>
                <span className={TEXT_SUB}>창작 방식:</span>
                <span className="ml-2 text-sm text-gray-900">{asset.declaredCreationType}</span>
              </div>
            ) : null}
            {asset.fileSize ? (
              <div>
                <span className={TEXT_SUB}>파일 크기:</span>
                <span className="ml-2 text-sm text-gray-900">{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : null}
            <div>
              <span className={TEXT_SUB}>해시:</span>
              <span className="ml-2 font-mono text-sm text-gray-900">{asset.contentHash.substring(0, 16)}...</span>
            </div>
          </div>

          {asset.fileUrl ? (
            <div className="mb-4">
              <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#3B82F6]">
                파일 보기/다운로드 →
              </a>
            </div>
          ) : null}

          {asset.textContent ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">텍스트 내용</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{asset.textContent}</pre>
            </div>
          ) : null}
        </div>

        <div className={CARD_BASE}>
          <h2 className={`${TITLE_PAGE} mb-4`}>전문가 평가</h2>
          {feedbacksLoading ? (
            <div className="py-8 text-center text-sm text-gray-600">{t('loading')}</div>
          ) : feedbacks?.content && feedbacks.content.length > 0 ? (
            <div className="flex flex-col gap-4">
              {feedbacks.content.map((feedback: ExpertFeedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-600">아직 평가가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeedbackCard({ feedback }: { feedback: ExpertFeedback }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] p-4">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-900">{feedback.evaluatorName || '평가자'}</span>
          <span className="ml-2 text-sm text-gray-600">
            ({feedback.evaluatorType === 'AGENCY' ? '기획사' : '인증 평가자'})
          </span>
        </div>
        {feedback.rating ? (
          <div className="flex items-center text-sm text-gray-600">
            {'⭐'.repeat(feedback.rating)}
            <span className="ml-2">{feedback.rating}/5</span>
          </div>
        ) : null}
      </div>
      {feedback.comment ? <p className="mb-2 text-sm text-gray-700">{feedback.comment}</p> : null}
      {feedback.evidenceLink ? (
        <a href={feedback.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#3B82F6]">
          증거 패키지 보기 →
        </a>
      ) : null}
      <div className={`mt-2 ${TEXT_SUB}`}>
        {new Date(feedback.createdAt).toLocaleString('ko-KR')}
        {!feedback.isPublic ? <span className="ml-2">(비공개)</span> : null}
      </div>
    </div>
  )
}
